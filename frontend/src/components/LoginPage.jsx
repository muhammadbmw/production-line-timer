import React, { useState } from 'react';
import { fetchBuildData, startSession } from '../api/api';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [loginId, setLoginId] = useState('');
  const [buildNumber, setBuildNumber] = useState('');
  const [buildInfo, setBuildInfo] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleFetchBuild = async () => {
    try {
      const res = await fetchBuildData(buildNumber);
      setBuildInfo(res.data);
      setError(null);
    } catch (err) {
      setBuildInfo(null);
      setError('Build not found');
    }
  };

  const handleStart = async () => {
    if (!loginId || !buildNumber) {
      return setError('Please enter both fields');
    }

    try {
      const res = await startSession(loginId, buildNumber);
      localStorage.setItem('loginId', loginId);
      localStorage.setItem('session', JSON.stringify(res.data));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to start session');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-center">Production Tracker Login</h2>

        <input
          type="text"
          placeholder="Login ID"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Build Number"
            value={buildNumber}
            onChange={(e) => setBuildNumber(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleFetchBuild}
          >
            Check
          </button>
        </div>

        {buildInfo && (
          <div className="border p-3 rounded text-sm bg-green-50">
            <p><strong>Parts:</strong> {buildInfo.numberOfParts}</p>
            <p><strong>Time per Part:</strong> {buildInfo.timePerPart} min</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700"
          onClick={handleStart}
        >
          Start
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
