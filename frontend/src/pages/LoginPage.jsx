import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBuild, startSession } from '../api/api';

export default function LoginPage() {
  const [loginId, setLoginId] = useState(localStorage.getItem('loginId') || '');
  const [buildNumber, setBuildNumber] = useState('');
  const [buildInfo, setBuildInfo] = useState(null);
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleCheck = async () => {
    setError('');
    try {
      const res = await fetchBuild(buildNumber);
      setBuildInfo(res.data);
    } catch (err) {
      setBuildInfo(null);
      setError('Build not found');
    }
  };

  const handleStart = async () => {
    if (!loginId || !buildNumber) { setError('Enter both loginId and buildNumber'); return; }
    try {
      const res = await startSession(loginId, buildNumber);
      // store minimal session in sessionStorage to resume on refresh
      sessionStorage.setItem('activeSession', JSON.stringify(res.data));
      localStorage.setItem('loginId', loginId);
      nav('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to start session');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Production Tracker — Login & Build</h2>

        <div style={{marginTop:12}}>
          <label className="small">Login ID</label><br />
          <input className="input" value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="e.g. JohnDoe" />
        </div>

        <div style={{marginTop:12}}>
          <label className="small">Build Number</label><br />
          <input className="input" value={buildNumber} onChange={e=>setBuildNumber(e.target.value)} placeholder="e.g. 123456" />
          <button onClick={handleCheck} className="btn btn-gray" style={{marginLeft:8}}>Check</button>
        </div>

        {buildInfo && (
          <div style={{marginTop:12, padding:10, background:'#f0fdf4', borderRadius:6}}>
            <div><strong>Parts:</strong> {buildInfo.numberOfParts}</div>
            <div><strong>Time/Part (min):</strong> {buildInfo.timePerPart}</div>
          </div>
        )}

        {error && <div style={{color:'#ef4444', marginTop:10}}>{error}</div>}

        <div style={{marginTop:14}}>
          <button className="btn btn-green" onClick={handleStart}>Start</button>
        </div>
      </div>
    </div>
  );
}
