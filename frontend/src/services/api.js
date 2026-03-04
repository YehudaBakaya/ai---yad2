import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── AI API (Express backend) ────────────────────────────────────────────────
export const aiAPI = {
  negotiate:           (data) => api.post('/ai/negotiate', data),
  generateDescription: (data) => api.post('/ai/generate-description', data),
  analyzePrice:        (data) => api.post('/ai/analyze-price', data),
  getRecommendations:  (data) => api.post('/ai/recommendations', data),
};

export default api;
