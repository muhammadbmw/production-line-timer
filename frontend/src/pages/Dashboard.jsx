import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import {
  getActiveSession, pauseSession, resumeSession,
  setDefects, popupResponse, submitSession
} from '../api/api';

dayjs.extend(duration);

function formatHHMMSS(s) {
  const isNegative = s < 0;
  const abs = Math.abs(s);
  const dur = dayjs.duration(abs * 1000);
  const hh = String(Math.floor(dur.asHours())).padStart(2,'0');
  const mm = String(dur.minutes()).padStart(2,'0');
  const ss = String(dur.seconds()).padStart(2,'0');
  return `${isNegative?'-':''}${hh}:${mm}:${ss}`;
}

export default function Dashboard() {
  const nav = useNavigate();
  const [session, setSession] = useState(() => {
    const s = sessionStorage.getItem('activeSession');
    return s ? JSON.parse(s) : null;
  });
  const loginId = localStorage.getItem('loginId') || (session && session.loginId);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAccumSec, setPausedAccumSec] = useState(0); // seconds
  const pauseStartRef = useRef(null);
  const timerRef = useRef(null);

  // popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const popupTimeoutRef = useRef(null);
  const [popupRemainingSec, setPopupRemainingSec] = useState(600); // countdown for popup
  const popupStartedAtRef = useRef(null);
  const [defects, setDefectsState] = useState(session?.defects || 0);

  // ensure session exists; otherwise navigate back
  useEffect(() => {
    if (!session) {
      // try fetch active session from server using loginId
      if (!loginId) { nav('/'); return; }
      (async () => {
        try {
          const res = await getActiveSession(loginId);
          setSession(res.data);
          sessionStorage.setItem('activeSession', JSON.stringify(res.data));
        } catch (err) {
          // no active session -> go back to login
          nav('/');
        }
      })();
    }
  }, []);

  // compute totalSeconds
  const totalSeconds = session ? Math.round(session.numberOfParts * session.timePerPart * 60) : 0;

  // compute remaining time every second (server-time based via startTime and pausedAccum)
  useEffect(() => {
    if (!session) return;
    const startMs = new Date(session.startTime).getTime();

    const tick = () => {
      const now = Date.now();
      // total paused ms recorded on server is accounted for via pausedAccumSec (seconds)
      // plus an active pause (if currently paused) is handled separately
      const pausedMs = pausedAccumSec * 1000 + (pauseStartRef.current ? (now - pauseStartRef.current) : 0);
      const elapsedSec = Math.floor((now - startMs - pausedMs) / 1000);
      const left = totalSeconds - elapsedSec;
      setTimeLeftSec(left);
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session, pausedAccumSec]);

  // when timer crosses zero, open popup
  useEffect(() => {
    if (timeLeftSec <= 0 && !popupOpen) {
      openPopup();
    }
  }, [timeLeftSec]);

  // popup countdown loop
  useEffect(() => {
    if (!popupOpen) return;
    const tick = () => {
      const elapsedSoFar = Math.floor((Date.now() - popupStartedAtRef.current) / 1000);
      const rem = Math.max(0, 600 - elapsedSoFar);
      setPopupRemainingSec(rem);
      if (rem <= 0) {
        // auto submit
        handlePopupResponse('timeout');
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [popupOpen]);

  // helpers: open popup, schedule timeout (handled by effect)
  function openPopup() {
    setPopupOpen(true);
    popupStartedAtRef.current = Date.now();
    // persist popup start time so reload can restore it
    sessionStorage.setItem('popupStartAt', new Date().toISOString());
    // also tell server a popup occurred? optional; we'll record response when user acts
  }

  // restore popup on reload
  useEffect(() => {
    const stored = sessionStorage.getItem('popupStartAt');
    if (stored) {
      const started = new Date(stored).getTime();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      if (elapsed < 600) {
        setPopupOpen(true);
        popupStartedAtRef.current = started;
        setPopupRemainingSec(600 - elapsed);
      } else {
        // already exceeded => auto submit immediately
        handlePopupResponse('timeout');
      }
    }
  }, []);

  // Pause/resume actions (call server and update local state)
  const handlePause = async () => {
    if (!session) return;
    try {
      await pauseSession(loginId);
      // start local pause timer
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    if (!session) return;
    try {
      await resumeSession(loginId);
      // close local pause: compute seconds paused and add to pausedAccumSec
      if (pauseStartRef.current) {
        const pausedSec = Math.floor((Date.now() - pauseStartRef.current) / 1000);
        setPausedAccumSec(prev => prev + pausedSec);
        pauseStartRef.current = null;
      }
      setIsPaused(false);
    } catch (err) {
      console.error(err);
    }
  };

  // defects local update + server
  const handleDefectsChange = (val) => {
    const n = Math.max(0, Number(val || 0));
    setDefectsState(n);
    try { setDefects(loginId, n); } catch (e) { console.error(e); }
  };

  // popup responses
  const handlePopupResponse = async (response) => {
    // response: 'yes' | 'no' | 'timeout'
    setPopupOpen(false);
    sessionStorage.removeItem('popupStartAt');
    try {
      await popupResponse(loginId, response);
    } catch (err) { console.error(err); }

    if (response === 'timeout') {
      // auto-submit session now
      await autoSubmit();
      return;
    }

    // schedule next popup in 10 minutes (we use setTimeout that persists in memory; if reload, we persist start at)
    const scheduleTime = Date.now() + 10 * 60 * 1000;
    // persist when the next popup should start (so reload can restore)
    sessionStorage.setItem('nextPopupAt', new Date(scheduleTime).toISOString());
    // start local timer to open popup after 10 minutes
    setTimeout(() => {
      // show popup again if session still active
      openPopup();
    }, 10 * 60 * 1000);
  };

  // restore scheduled next popup on reload
  useEffect(() => {
    const next = sessionStorage.getItem('nextPopupAt');
    if (next) {
      const at = new Date(next).getTime();
      const delta = at - Date.now();
      if (delta <= 0) {
        openPopup();
        sessionStorage.removeItem('nextPopupAt');
      } else {
        setTimeout(() => {
          openPopup();
          sessionStorage.removeItem('nextPopupAt');
        }, delta);
      }
    }
  }, []);

  // auto-submit: POST and clear session
  const autoSubmit = async () => {
    try {
      const payload = {
        loginId,
        totalParts: session.totalParts || 0,
        auto: true
      };
      // server will compute times using stored session data
      await submitSession(payload);
    } catch (err) {
      console.error(err);
    } finally {
      // clear stored session and navigate to login
      sessionStorage.removeItem('activeSession');
      sessionStorage.removeItem('popupStartAt');
      sessionStorage.removeItem('nextPopupAt');
      localStorage.removeItem('loginId');
      nav('/');
    }
  };

  // manual Next -> go to final submit page (persist local pausedAccum and defects to storage)
  const handleNext = async () => {
    // update local copy stored in sessionStorage (so final page restores)
    const s = { ...session, defects, pausedAccumSec };
    sessionStorage.setItem('activeSession', JSON.stringify(s));
    nav('/final');
  };

  // UI render
  if (!session) {
    return <div className="container"><div className="card">Loading session...</div></div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header-row">
          <div><strong>Login ID:</strong> {loginId}</div>
          <div><strong>Build:</strong> {session.buildNumber}</div>
          <div><strong>Parts:</strong> {session.numberOfParts}</div>
          <div><strong>Time/Part (min):</strong> {session.timePerPart}</div>
        </div>

        <div className="timer" style={{ color: timeLeftSec <= 0 ? '#ef4444' : '#059669' }}>
          {formatHHMMSS(timeLeftSec)}
        </div>

        {!isPaused ? (
          <button className="btn btn-gray" onClick={handlePause}>Pause</button>
        ) : (
          <button className="btn btn-green" onClick={handleResume}>Resume</button>
        )}

        <div style={{marginTop:12}}>
          <label className="small">Defects encountered</label><br />
          <input className="input" type="number" value={defects} onChange={e=>handleDefectsChange(e.target.value)} style={{width:120}} />
        </div>

        <div style={{marginTop:14}}>
          <button className="btn btn-green" onClick={handleNext}>Next</button>
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div className="overlay">
          <div className="modal">
            <div style={{marginBottom:12}}>Work Paused</div>
            <button className="btn btn-green" onClick={handleResume}>Resume Work</button>
          </div>
        </div>
      )}

      {/* Popup overlay */}
      {popupOpen && (
        <div className="overlay">
          <div className="modal">
            <h3>Time is up. Do you wish to continue?</h3>
            <p className="small" style={{marginTop:8}}>
              Auto-submit in: <strong>{formatHHMMSS(popupRemainingSec)}</strong>
            </p>
            <div style={{marginTop:12, display:'flex', gap:10, justifyContent:'center'}}>
              <button className="btn btn-green" onClick={() => handlePopupResponse('yes')}>Yes</button>
              <button className="btn btn-gray" onClick={() => handlePopupResponse('no')}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
