import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../features/auth/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token expired or invalid
      store.dispatch(logout());
      window.location.href = '/login';
    }
    
    if (response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden');
    }
    
    if (response?.status >= 500) {
      // Server error
      console.error('Server error:', response.data?.message || 'Internal server error');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyPhone: (phoneData) => api.post('/auth/verify-phone', phoneData),
  verifyOTP: (otpData) => api.post('/auth/verify-otp', otpData),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export const profileAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (profileData) => api.put('/auth/update-profile', profileData),
  uploadAvatar: (formData) => api.put('/auth/update-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addPortfolioItem: (portfolioData) => api.put('/auth/update-profile', portfolioData),
  updatePortfolioItem: (itemId, portfolioData) => api.put('/auth/update-profile', portfolioData),
  deletePortfolioItem: (itemId) => api.put('/auth/update-profile', { removePortfolioItem: itemId }),
  updateAvailability: (availability) => api.put('/auth/update-profile', { availability }),

  getEarnings: (period) => api.get(`/profiles/earnings?period=${period}`),
};

export const jobsAPI = {
  getJobs: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/jobs?${params}`);
  },
  getJob: (jobId) => api.get(`/jobs/${jobId}`),
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (jobId, jobData) => api.put(`/jobs/${jobId}`, jobData),
  deleteJob: (jobId) => api.delete(`/jobs/${jobId}`),
  applyToJob: (jobId, applicationData) => api.post(`/jobs/${jobId}/apply`, applicationData),
  getApplications: (jobId) => api.get(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (applicationId, status) => api.patch(`/applications/${applicationId}`, { status }),

};



export const notificationsAPI = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  updateSettings: (settings) => api.put('/notifications/settings', settings),
  getSettings: () => api.get('/notifications/settings'),
};

export const reviewAPI = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getWorkerReviews: (workerId, page = 1, limit = 10) => api.get(`/reviews/worker/${workerId}?page=${page}&limit=${limit}`),
  getMyReviews: (page = 1, limit = 10) => api.get(`/reviews/my-reviews?page=${page}&limit=${limit}`),
  getReceivedReviews: (page = 1, limit = 10) => api.get(`/reviews/received?page=${page}&limit=${limit}`),
};

export const savedWorkersAPI = {
  getSavedWorkers: () => api.get('/saved-workers'),
  saveWorker: (workerId) => api.post(`/saved-workers/${workerId}`),
  removeSavedWorker: (workerId) => api.delete(`/saved-workers/${workerId}`),
  checkIfWorkerSaved: (workerId) => api.get(`/saved-workers/check/${workerId}`),
};

export const workerSearchAPI = {
  searchWorkers: (params) => api.get('/workers/search', { params }),
  getWorkerProfile: (workerId) => api.get(`/workers/${workerId}`),
  getWorkerPosts: (workerId, params) => api.get(`/workers/${workerId}/posts`, { params }),
};

export const adminAPI = {
  getUsers: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/admin/users?${params}`);
  },
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getReports: () => api.get('/admin/reports'),

  getAnalytics: (period) => api.get(`/admin/analytics?period=${period}`),
  getSystemStats: () => api.get('/admin/stats'),
};

export default api;