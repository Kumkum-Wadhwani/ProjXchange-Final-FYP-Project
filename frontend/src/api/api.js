import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'https://projxchange-final-fyp-project-production.up.railway.app/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — NO alert popups, all silent
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);

    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Silent — just log
          console.error('Access denied:', error.config?.url);
          break;
        case 404:
          // Silent — just log
          console.error('Resource not found:', error.config?.url);
          break;
        case 500:
          // Silent — just log, no popup
          console.error('Server error:', error.config?.url);
          break;
        default:
          // Silent — just log
          console.error('API Error:', error.message);
      }
    } else if (error.request) {
      // Network error — silent, just log
      console.error('No response received:', error.config?.url);
    } else {
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper methods
API.helpers = {
  getAdminStats: () => API.get('/admin/stats'),
  getAdminUsers: () => API.get('/admin/users'),
  getAdminProjects: () => API.get('/admin/projects'),
  getAdminTransactions: () => API.get('/admin/transactions'),
  getAdminEarnings: () => API.get('/admin/earnings'),
  updateUserStatus: (userId, is_active) =>
    API.patch(`/admin/users/${userId}/status`, { is_active }),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  updateProjectStatus: (projectId, status) =>
    API.patch(`/admin/projects/${projectId}/status`, { status }),
};

// Bid pack purchase
export const getBidPacks = () => API.get('/bid-packs/packs');
export const createBidPackPaymentIntent = (packSize) =>
  API.post('/bid-packs/create-payment-intent', { packSize });
export const confirmBidPackPurchase = (paymentIntentId) =>
  API.post('/bid-packs/confirm', { paymentIntentId });

// Project likes
export const likeProject = (projectId) =>
  API.post(`/projects/investor/like/${projectId}`);

// Bid credits
export const getBidCredits = () => API.get('/projects/investor/bid-credits');

// Get projects with category filter
export const getInvestorProjects = (category = '') => {
  const url = category
    ? `/projects/investor/browse?category=${encodeURIComponent(category)}`
    : '/projects/investor/browse';
  return API.get(url);
};

export default API;
