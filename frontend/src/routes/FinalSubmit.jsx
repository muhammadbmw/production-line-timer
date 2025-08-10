import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FinalSubmit = () => {
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('session'));
  const loginId = localStorage.getItem('loginId');

  const [totalParts, setTotalParts] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!totalParts || isNaN(totalParts)) {
      alert('Please enter a valid number for total parts.');
      return;
    }

    setSubmitting(true);

    const payload = {
      loginId,
      buildNumber: session.buildNumber,
      numberOfParts: session.numberOfParts,
      timePerPart: session.timePerPart,
      startTime: session.startTime,
      totalPausedTime: session.pausedTime || 0,
      defects: session.defects,
      totalParts: parseInt(totalParts),
      autoSubmitted: false,
      timestamps: {
        pauseStartTimes: [], // Optional: can be tracked and sent if needed
        resumeTimes: [],
        popupResponses: []
      }
    };

    try {
      await axios.post('http://localhost:5000/api/sessions', payload);
      alert('✅ Session submitted successfully!');
      localStorage.removeItem('session');
      localStorage.removeItem('loginId');
      navigate('/');
    } catch (err) {
      console.error('Submit Error:', err);
      alert('Error submitting session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <h2 className="text-2xl font-bold mb-4">Final Submission</h2>

      <div className="mb-4">
        <label className="font-semibold">Total Parts Completed:</label>
        <input
          type="number"
          value={totalParts}
          onChange={(e) => setTotalParts(e.target.value)}
          className="border p-2 rounded ml-2 w-32"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Back
        </button>

        <button
          onClick={handleSubmit}
          className="bg-green-700 text-white px-4 py-2 rounded"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default FinalSubmit;
