import Session from '../models/Session.js';
import Build from '../models/Build.js';


/**
 * POST /api/session/start
 * Body: { loginId, buildNumber }
 * If a session with no submission exists for loginId, return it (resume).
 * Else create new session from build metadata.
 */
export const startSession = async (req, res) => {
    try {
        const { loginId, buildNumber } = req.body;
        if (!loginId || !buildNumber) return res.status(400).json({ error: 'Missing fields' });

        // try find active (not submitted) session for this loginId
        let session = await Session.findOne({ loginId, 'submission.submittedAt': { $exists: false } });

        if (!session) {
        const build = await Build.findOne({ buildNumber });
        if (!build) return res.status(404).json({ error: 'Build not found' });

        session = await Session.create({
            loginId,
            buildNumber,
            numberOfParts: build.numberOfParts,
            timePerPart: build.timePerPart,
            startTime: new Date(),
            pausedDurations: [],
            defects: 0,
            popupResponses: []
        });
        }

        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}


/**
 * GET /api/session/active/:loginId
 * Return active (not submitted) session for loginId
 */
export const getSession = async (req, res) => {
    try {
        const session = await Session.findOne({ loginId: req.params.loginId, 'submission.submittedAt': { $exists: false } });
        if (!session) return res.status(404).json({ error: 'No active session' });
        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * POST /api/session/pause
 * Body: { loginId }
 * Push a pausedDurations entry { start: now, end: null }
 */
export const pauseSession = async (req, res) => {
    try {
        const { loginId } = req.body;
        const session = await Session.findOne({ loginId, 'submission.submittedAt': { $exists: false } });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        session.pausedDurations.push({ start: new Date(), end: null });
        await session.save();
        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }

}

/**
 * POST /api/session/resume
 * Body: { loginId }
 * Set the end field of the last pausedDurations item to now
 */
export const resumeSession = async (req, res) => {
    try {
        const { loginId } = req.body;
        const session = await Session.findOne({ loginId, 'submission.submittedAt': { $exists: false } });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const last = session.pausedDurations[session.pausedDurations.length - 1];
        if (last && !last.end) last.end = new Date();
        await session.save();
        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
        
}

/**
 * POST /api/session/defect
 * Body: { loginId, defects }   // defects is a number (overwrite)
 */
export const handleDefect = async (req, res) => {
    try {
        const { loginId, defects } = req.body;
        const session = await Session.findOneAndUpdate(
        { loginId, 'submission.submittedAt': { $exists: false } },
        { $set: { defects: defects || 0 } },
        { new: true }
        );
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
    
}

/**
 * POST /api/session/submit
 * Body: {
 *   loginId,
 *   totalParts,
 *   auto (optional boolean),
 *   // optional: additional timestamps or arrays (pause timestamps etc)
 * }
 *
 * This finalizes the session, computes active/inactive times and saves submission time.
 */
export const handleSubmit = async (req, res) => {
    try {
        const { loginId, totalParts, auto = false } = req.body;
        const session = await Session.findOne({ loginId, 'submission.submittedAt': { $exists: false } });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        // compute paused ms
        const pausedMs = session.computeTotalPausedMs();
        const startMs = new Date(session.startTime).getTime();
        const nowMs = Date.now();
        const rawDurationMs = nowMs - startMs;

        const activeMs = Math.max(0, rawDurationMs - pausedMs);

        session.totalParts = typeof totalParts === 'number' ? totalParts : null;
        session.totalActiveTime = Math.floor(activeMs / 1000);   // seconds
        session.totalInactiveTime = Math.floor(pausedMs / 1000); // seconds
        session.submission = {
        submittedAt: new Date(),
        auto: !!auto
        };

        await session.save();
        res.json({ message: 'Session submitted', session });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
    
}


/**
 * POST /api/session/popup
 * Body: { loginId, response }   // response: 'yes' | 'no' | 'timeout'
 * Record popup response and return session
 */
export const handlePopup = async (req, res) => {
    try {
        const { loginId, response } = req.body;
        if (!['yes', 'no', 'timeout'].includes(response)) {
        return res.status(400).json({ error: 'Invalid response' });
        }
        const session = await Session.findOne({ loginId, 'submission.submittedAt': { $exists: false } });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        session.popupResponses.push({ time: new Date(), response });
        await session.save();
        res.json(session);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}