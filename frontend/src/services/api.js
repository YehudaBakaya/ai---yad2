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

// ── Listings API (MongoDB via Express) ──────────────────────────────────────
export const listingsAPI = {
  getAll:    (params = {})   => api.get('/listings', { params }),
  getOne:    (id)            => api.get(`/listings/${id}`),
  getByUser: (userId)        => api.get('/listings', { params: { userId } }),
  create:    (data)          => api.post('/listings', data),
  update:    (id, data)      => api.put(`/listings/${id}`, data),
  remove:    (id)            => api.delete(`/listings/${id}`),
  categories: ()             => api.get('/listings/categories/all'),
};

// ── Auth API (MongoDB sync) ──────────────────────────────────────────────────
export const authAPI = {
  firebaseSync: (data) => api.post('/auth/firebase-sync', data),
};

export default api;
