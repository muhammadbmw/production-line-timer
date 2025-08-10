import React, { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useNavigate } from 'react-router-dom';

dayjs.extend(duration);

const Dashboard = () => {
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('session'));
  const loginId = localStorage.getItem('loginId');

  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStart, setPauseStart] = useState(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [defects, setDefects] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTimer, setPopupTimer] = useState(600); // 10 minutes
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(600);
  const popupRef = useRef(null);

  // Calculate total build time in seconds
  const totalSeconds = session.numberOfParts * session.timePerPart * 60;
  const startTime = dayjs(session.startTime);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && !showPopup) {
        const now = dayjs();
        const elapsed = now.diff(startTime, 'second') - pausedTime;
        const left = totalSeconds - elapsed;
        setTimeLeft(left);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pausedTime, isPaused, showPopup]);

  // Timer expired logic
  useEffect(() => {
    if (timeLeft <= 0 && !showPopup) {
      setShowPopup(true);
      setAutoSubmitCountdown(600);
    }
  }, [timeLeft]);

  // Auto-submit countdown
  useEffect(() => {
    if (showPopup) {
      const timer = setInterval(() => {
        setAutoSubmitCountdown((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      popupRef.current = timer;
      return () => clearInterval(timer);
    }
  }, [showPopup]);

  const handlePause = () => {
    setIsPaused(true);
    setPauseStart(dayjs());
  };

  const handleResume = () => {
    const now = dayjs();
    const pauseDuration = now.diff(pauseStart, 'second');
    setPausedTime((prev) => prev + pauseDuration);
    setIsPaused(false);
    setPauseStart(null);
  };

  const handleDefectChange = (e) => {
    setDefects(parseInt(e.target.value || 0));
  };

  const handlePopupAction = () => {
    setShowPopup(false);
    clearInterval(popupRef.current);
    setAutoSubmitCountdown(600); // Reset for next popup
    setTimeout(() => setShowPopup(true), 10 * 60 * 1000);
  };

  const handleAutoSubmit = () => {
    // Simulate auto-submit
    alert('⏱ Auto-submitting session due to inactivity.');
    localStorage.removeItem('session');
    navigate('/');
  };

  const formatTime = (sec) => {
    const dur = dayjs.duration(sec * 1000);
    const isNegative = sec < 0;
    return `${isNegative ? '-' : ''}${dur.format('HH:mm:ss')}`;
  };

  const handleNext = () => {
    // Store defects in localStorage for now
    const updatedSession = {
      ...session,
      defects,
      pausedTime,
    };
    localStorage.setItem('session', JSON.stringify(updatedSession));
    navigate('/final');
  };

  return (
    <div className="min-h-screen p-4 bg-white text-gray-900">
      <h2 className="text-2xl font-bold mb-4">Production Timer</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <p><strong>Login ID:</strong> {loginId}</p>
        <p><strong>Build Number:</strong> {session.buildNumber}</p>
        <p><strong>Parts:</strong> {session.numberOfParts}</p>
        <p><strong>Time per Part:</strong> {session.timePerPart} min</p>
      </div>

      <div className={`text-4xl font-bold mb-6 ${timeLeft <= 0 ? 'text-red-600' : 'text-green-700'}`}>
        {formatTime(timeLeft)}
      </div>

      <div className="flex space-x-4 mb-4">
        {!isPaused ? (
          <button onClick={handlePause} className="bg-yellow-500 px-4 py-2 text-white rounded">
            Pause
          </button>
        ) : (
          <button onClick={handleResume} className="bg-blue-500 px-4 py-2 text-white rounded">
            Resume
          </button>
        )}
      </div>

      <div className="mb-4">
        <label>Defects:</label>
        <input
          type="number"
          className="border ml-2 p-2 rounded w-24"
          value={defects}
          onChange={handleDefectChange}
        />
      </div>

      <button onClick={handleNext} className="bg-green-700 text-white px-6 py-2 rounded">
        Next
      </button>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <button
            onClick={handleResume}
            className="bg-white text-black px-6 py-3 rounded text-lg"
          >
            Resume Work
          </button>
        </div>
      )}

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
            <p className="text-xl mb-4 font-semibold">Time is up. Do you wish to continue?</p>
            <p className="text-red-600 text-lg mb-4">Auto-submitting in {formatTime(autoSubmitCountdown)}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handlePopupAction}
                className="bg-green-600 text-white px-6 py-2 rounded"
              >
                Yes
              </button>
              <button
                onClick={handlePopupAction}
                className="bg-gray-600 text-white px-6 py-2 rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
