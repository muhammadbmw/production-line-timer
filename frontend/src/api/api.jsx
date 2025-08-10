import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

export const fetchBuild = (buildNumber) => api.get(`/build/${buildNumber}`);
export const startSession = (loginId, buildNumber) => api.post('/session/start', { loginId, buildNumber });
export const getActiveSession = (loginId) => api.get(`/session/active/${loginId}`);
export const pauseSession = (loginId) => api.post('/session/pause', { loginId });
export const resumeSession = (loginId) => api.post('/session/resume', { loginId });
export const setDefects = (loginId, defects) => api.post('/session/defect', { loginId, defects });
export const popupResponse = (loginId, response) => api.post('/session/popup', { loginId, response });
export const submitSession = (payload) => api.post('/session/submit', payload);

