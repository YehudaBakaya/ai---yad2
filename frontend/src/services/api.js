import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Listings API
export const listingsAPI = {
  getAll: (params = {}) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  getCategories: () => api.get('/listings/categories/all'),
};

// AI API
export const aiAPI = {
  negotiate: (data) => api.post('/ai/negotiate', data),
  generateDescription: (data) => api.post('/ai/generate-description', data),
  analyzePrice: (data) => api.post('/ai/analyze-price', data),
  getRecommendations: (data) => api.post('/api/recommendations', data),
};

export default api;
