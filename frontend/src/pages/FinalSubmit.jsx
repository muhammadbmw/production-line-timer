import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSession } from '../api/api';

export default function FinalSubmit() {
  const nav = useNavigate();
  const stored = sessionStorage.getItem('activeSession');
  const session = stored ? JSON.parse(stored) : null;
  const loginId = localStorage.getItem('loginId');

  const [totalParts, setTotalParts] = useState(session?.totalParts || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session || !loginId) nav('/');
  }, []);

  const handleBack = () => nav('/dashboard');

  const handleSubmit = async () => {
    if (!loginId) return nav('/');
    setSubmitting(true);
    try {
      const payload = {
        loginId,
        totalParts: Number(totalParts || 0),
        auto: false
      };
      await submitSession(payload);
      // clear
      sessionStorage.removeItem('activeSession');
      sessionStorage.removeItem('popupStartAt');
      sessionStorage.removeItem('nextPopupAt');
      localStorage.removeItem('loginId');
      alert('Session submitted');
      nav('/');
    } catch (err) {
      console.error(err);
      alert('Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h3>Final Submission</h3>
        <div style={{marginTop:8}}>
          <label className="small">Total Parts Completed</label><br />
          <input className="input" type="number" value={totalParts} onChange={e=>setTotalParts(e.target.value)} style={{width:120}} />
        </div>

        <div style={{marginTop:12, display:'flex', gap:8}}>
          <button className="btn btn-gray" onClick={handleBack}>Back</button>
          <button className="btn btn-green" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
}
