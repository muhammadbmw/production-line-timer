import Session from '../models/Session.js';
import Build from '../models/Build.js';

export const startSession = async (req, res) => {
    const { loginId, buildNumber } = req.body;
    let session = await Session.findOne({ loginId, submission: null });

    if (!session) {
    const build = await Build.findOne({ buildNumber });
    if (!build) return res.status(404).json({ error: 'Build not found' });

        session = await Session.create({
            loginId,
            buildNumber,
            numberOfParts: build.numberOfParts,
            timePerPart: build.timePerPart,
            startTime: new Date()
        });
    }

    res.json(session);
}

export const getSession = async (req, res) => {
    const session = await Session.findOne({ loginId: req.params.loginId, submission: null });
    if (!session) return res.status(404).json({ error: 'No active session' });
    res.json(session);
}

export const pauseSession = async (req, res) => {
    const { loginId } = req.body;
    const session = await Session.findOne({ loginId, submission: null });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.pausedDurations.push({ start: new Date(), end: null });
    await session.save();
    res.json(session);

}

export const resumeSession = async (req, res) => {
    const { loginId } = req.body;
    const session = await Session.findOne({ loginId, submission: null });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const lastPause = session.pausedDurations[session.pausedDurations.length - 1];
    if (lastPause && !lastPause.end) lastPause.end = new Date();
    await session.save();
    res.json(session);
    
}

export const handleDefect = async (req, res) => {
  const { loginId, defects } = req.body;
  const session = await Session.findOneAndUpdate({ loginId, submission: null }, { defects }, { new: true });
  res.json(session);
    
}

export const handleSubmit = async (req, res) => {
    const { loginId, totalParts, auto = false } = req.body;
    const session = await Session.findOne({ loginId, submission: null });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.totalParts = totalParts;
    session.submission = {
        submittedAt: new Date(),
        auto
    };

    await session.save();
    res.json({ message: 'Session submitted', session });
    
}

export const handlePopup = async (req, res) => {
    const { loginId } = req.body;
    const session = await Session.findOne({ loginId, submission: null });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.popupTimestamps.push(new Date());
    await session.save();
    res.json(session);
}