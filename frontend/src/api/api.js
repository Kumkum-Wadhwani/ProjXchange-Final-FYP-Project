import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000, // Increased timeout
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

// Response interceptor
API.interceptors.response.use(
  (response) => {
    // You can modify response data here if needed
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 401:
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - no permission
          alert('Access denied. You do not have permission to access this resource.');
          break;
        case 404:
          // Not found
          console.error('Resource not found:', error.config.url);
          break;
        case 500:
          // Server error
          alert('Server error. Please try again later.');
          break;
        default:
          // Other errors
          console.error('API Error:', error.message);
      }
    } else if (error.request) {
      // Request was made but no response
      console.error('No response received:', error.request);
      alert('Network error. Please check your connection and try again.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Add helper methods for common requests
API.helpers = {
  // Admin endpoints
  getAdminStats: () => API.get('/admin/stats'),
  getAdminUsers: () => API.get('/admin/users'),
  getAdminProjects: () => API.get('/admin/projects'),
  getAdminTransactions: () => API.get('/admin/transactions'),
  getAdminEarnings: () => API.get('/admin/earnings'),
  
  // User management
  updateUserStatus: (userId, is_active) => 
    API.patch(`/admin/users/${userId}/status`, { is_active }),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  
  // Project management
  updateProjectStatus: (projectId, status) =>
    API.patch(`/admin/projects/${projectId}/status`, { status }),
};



// Bid pack purchase
export const getBidPacks = () => API.get('/bid-packs/packs');
export const createBidPackPaymentIntent = (packSize) => API.post('/bid-packs/create-payment-intent', { packSize });
export const confirmBidPackPurchase = (paymentIntentId) => API.post('/bid-packs/confirm', { paymentIntentId });

// Project likes
export const likeProject = (projectId) => API.post(`/projects/investor/like/${projectId}`);

// Bid credits
export const getBidCredits = () => API.get('/projects/investor/bid-credits');

// Get projects with category filter
export const getInvestorProjects = (category = '') => {
  const url = category ? `/projects/investor/browse?category=${encodeURIComponent(category)}` : '/projects/investor/browse';
  return API.get(url);
};
export default API;