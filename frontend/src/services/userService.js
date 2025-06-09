// User service now uses backend API instead of direct Firebase operations
// User service for backend API operations (replaces direct Firestore)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// User service for backend operations
export const userService = {
  // Create or update user profile via backend API (legacy method for backward compatibility)
  saveUserProfileLegacy: async (userId, userData, retryCount = 0) => {
    return userService.saveUserProfile(userId, userData, retryCount);
  },

  // Get user profile from backend API
  getUserProfile: async (userId) => {
    try {
      const response = await apiCall(`/users/${userId}`);
      console.log('User profile retrieved from backend:', response.user);
      return response.user;
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('No user profile found for:', userId);
        return null;
      }
      console.error('Error getting user profile from backend:', error);
      throw error;
    }
  },

  // Save user profile via backend API
  saveUserProfile: async (userId, userData, retryCount = 0) => {
    const maxRetries = 3;
    try {
      if (!userId) {
        throw new Error('Missing required parameter: userId');
      }
      
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid userData: must be a valid object');
      }
      
      // Clean userData to remove undefined, null, or empty values
      const cleanUserData = {};
      Object.keys(userData).forEach(key => {
        const value = userData[key];
        if (value !== undefined && value !== null && value !== '') {
          // Handle nested objects
          if (typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
            const cleanNestedData = {};
            Object.keys(value).forEach(nestedKey => {
              const nestedValue = value[nestedKey];
              if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                cleanNestedData[nestedKey] = nestedValue;
              }
            });
            if (Object.keys(cleanNestedData).length > 0) {
              cleanUserData[key] = cleanNestedData;
            }
          } else {
            cleanUserData[key] = value;
          }
        }
      });
      
      const finalUserData = {
        ...cleanUserData,
        updatedAt: new Date().toISOString(),
        createdAt: userData.createdAt || new Date().toISOString()
      };
      
      console.log('Saving user profile via backend API:', finalUserData);
      
      const response = await apiCall(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(finalUserData)
      });
      
      console.log('✅ User profile saved via backend successfully:', userId);
      return response;
    } catch (error) {
      console.error('❌ Error saving user profile via backend:', error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log(`🔄 Retrying save operation (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return userService.saveUserProfile(userId, userData, retryCount + 1);
      }
      
      throw error;
    }
  },

  // Mark profile as completed via backend API
  markProfileCompleted: async (userId, userType, retryCount = 0) => {
    const maxRetries = 3;
    try {
      if (!userId || !userType) {
        throw new Error('Missing required parameters: userId and userType');
      }
      
      // Clean data before sending to backend
      const updateData = {
        profileCompleted: true,
        userType: userType,
        profileCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Remove any undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });
      
      console.log('Marking profile as completed with data:', updateData);
      
      const response = await apiCall(`/users/${userId}/complete-profile`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      console.log('✅ Profile marked as completed via backend:', userId, userType);
      return response;
    } catch (error) {
      console.error('❌ Error marking profile as completed via backend:', error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.log(`🔄 Retrying mark completed operation (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return userService.markProfileCompleted(userId, userType, retryCount + 1);
      }
      
      throw error;
    }
  },

  // Sync user data from localStorage to backend
  syncUserToBackend: async (userId, localUserData) => {
    try {
      const existingData = await userService.getUserProfile(userId);
      const mergedData = {
        ...existingData,
        ...localUserData,
        lastSyncedAt: new Date().toISOString()
      };
      
      await userService.saveUserProfile(userId, mergedData);
      console.log('User data synced to backend:', userId);
      return mergedData;
    } catch (error) {
      console.error('Error syncing user to backend:', error);
      throw error;
    }
  }
};

export default userService;