// API URL utilities for consistent URL handling across the application

/**
 * Get the base API URL from environment variables
 * @returns {string} The base API URL
 */
export const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
};

/**
 * Get the base server URL (without /api) for file uploads and static assets
 * @returns {string} The base server URL
 */
export const getServerBaseUrl = () => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace('/api', '');
};

/**
 * Build a complete URL for static assets (images, files, etc.)
 * @param {string} path - The relative path or full URL
 * @returns {string} The complete URL
 */
export const buildAssetUrl = (path) => {
  if (!path) return '';
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it starts with /, prepend the server base URL
  if (path.startsWith('/')) {
    return `${getServerBaseUrl()}${path}`;
  }
  
  // If it's just a filename, assume it's in uploads directory
  return `${getServerBaseUrl()}/uploads/${path}`;
};

/**
 * Build a complete API endpoint URL
 * @param {string} endpoint - The API endpoint (e.g., '/auth/me')
 * @returns {string} The complete API URL
 */
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Handle profile photo URLs consistently
 * @param {string|object} photo - Photo path or object with path property
 * @returns {string} The complete photo URL
 */
export const getProfilePhotoUrl = (photo) => {
  if (!photo) return '';
  
  // Handle object with path property
  if (typeof photo === 'object' && photo.path) {
    return buildAssetUrl(photo.path);
  }
  
  // Handle string path
  return buildAssetUrl(photo);
};

/**
 * Handle work photo URLs consistently
 * @param {string|object} photo - Photo path or object with various properties
 * @returns {string} The complete photo URL
 */
export const getWorkPhotoUrl = (photo) => {
  if (!photo) return '';
  
  // Handle different object structures
  if (typeof photo === 'object') {
    if (photo.path) {
      return buildAssetUrl(photo.path);
    }
    if (photo.filename) {
      return buildAssetUrl(`/uploads/${photo.filename}`);
    }
    if (photo.name) {
      return buildAssetUrl(`/uploads/${photo.name}`);
    }
  }
  
  // Handle string path
  return buildAssetUrl(photo);
};

/**
 * Handle certificate URLs consistently
 * @param {string|object} cert - Certificate path or object with various properties
 * @returns {string} The complete certificate URL
 */
export const getCertificateUrl = (cert) => {
  if (!cert) return '';
  
  // Handle different object structures
  if (typeof cert === 'object') {
    if (cert.path) {
      return buildAssetUrl(cert.path);
    }
    if (cert.filename) {
      return buildAssetUrl(`/uploads/${cert.filename}`);
    }
    if (cert.name) {
      return buildAssetUrl(`/uploads/${cert.name}`);
    }
  }
  
  // Handle string path
  return buildAssetUrl(cert);
};