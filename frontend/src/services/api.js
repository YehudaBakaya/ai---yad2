import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — מוסיף JWT לכל בקשה ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — מנתק אוטומטית אם 401 ───────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // redirect לlog-in רק אם לא כבר שם
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Listings API ───────────────────────────────────────────────────────────
export const listingsAPI = {
  getAll:        (params = {}) => api.get('/listings', { params }),
  getById:       (id)          => api.get(`/listings/${id}`),
  create:        (data)        => api.post('/listings', data),
  getCategories: ()            => api.get('/listings/categories/all'),
};

// ── Auth API ───────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
  logout:   ()      => api.post('/auth/logout'),
  // Google OAuth — פותח redirect (לא axios)
  googleLogin: () => { window.location.href = `${API_BASE}/auth/google`; },
};

// ── AI API ─────────────────────────────────────────────────────────────────
export const aiAPI = {
  negotiate:           (data) => api.post('/ai/negotiate', data),
  generateDescription: (data) => api.post('/ai/generate-description', data),
  analyzePrice:        (data) => api.post('/ai/analyze-price', data),
  getRecommendations:  (data) => api.post('/ai/recommendations', data),
};

export default api;
