import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const fetchBuildData = (buildNumber) =>
  API.get(`/build/${buildNumber}`);

export const startSession = (loginId, buildNumber) =>
  API.post('/session/start', { loginId, buildNumber });

export const getActiveSession = (loginId) =>
  API.get(`/session/active/${loginId}`);
