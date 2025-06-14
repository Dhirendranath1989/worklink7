import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { auth } from '../../services/firebase';
import { getApiBaseUrl } from '../../utils/apiUtils';
import {
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from 'firebase/auth';
import { userService } from '../../services/userService';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed');
    }
  }
);

export const setPassword = createAsyncThunk(
  'auth/setPassword',
  async ({ newPassword }, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/set-password', { newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Set password failed');
    }
  }
);

export const verifyPhone = createAsyncThunk(
  'auth/verifyPhone',
  async ({ phone, recaptchaVerifier }, { rejectWithValue }) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      return { confirmationResult, phone };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ confirmationResult, otp }, { rejectWithValue }) => {
    try {
      const result = await confirmationResult.confirm(otp);
      return result.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Register with email
export const registerWithEmail = createAsyncThunk(
  'auth/registerWithEmail',
  async ({ email, password, firstName, lastName, role }, { rejectWithValue }) => {
    try {
      console.log('Attempting Firebase email registration for:', email);
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('Firebase registration successful:', firebaseUser.uid);
      
      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Send to backend for user management
      const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName, 
          lastName, 
          userType: role,
          firebaseUid: firebaseUser.uid 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If backend fails, delete the Firebase user
        await firebaseUser.delete();
        throw new Error(data.message || 'Registration failed');
      }
      
      console.log('Backend registration successful:', data.user);
      
      return data;
    } catch (error) {
      console.error('Email registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email registration is not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        default:
          errorMessage = error.message || 'Registration failed';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Login with email
export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('Attempting email login for:', email);
      
      // Login with backend API
      const response = await api.post('/auth/login', { email, password });
      
      console.log('Backend login successful:', response.data.user);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      console.error('Email login error:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // Backend API error
        errorMessage = error.response.data?.message || error.response.data?.error || 'Login failed';
      } else if (error.message) {
        // Network or other error
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Login with Google using redirect (fallback)
export const loginWithGoogleRedirect = createAsyncThunk(
  'auth/loginWithGoogleRedirect',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Starting Google redirect login...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      // Add prompt parameter for consistency
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Redirecting to Google...');
      await signInWithRedirect(auth, provider);
      
      // The actual result will be handled by getRedirectResult on page reload
      return { redirecting: true };
    } catch (error) {
      console.error('Google redirect login error:', error);
      return rejectWithValue(error.message || 'Google redirect login failed');
    }
  }
);

// Login with Google
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      // Check if Firebase auth is properly initialized
      if (!auth || !auth.app) {
        throw new Error('Firebase authentication is not properly initialized');
      }
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      // Add prompt parameter to reduce COOP warnings
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Starting Google login with Firebase app:', auth.app.options.projectId);
      
      // Use popup for Google sign-in with better error handling
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('Google sign-in successful:', user.email);
      
      // Prepare user data for backend (simplified approach without Firebase Admin)
      const userData = {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      };
      
      // Send to backend
      console.log('Sending user data to backend:', userData);
      const response = await api.post('/auth/google', { userData });
      
      console.log('Backend Google login successful:', response.data.user);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      
      // Check for COOP-related warnings (these are safe to ignore)
      if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
        console.warn('⚠️ COOP Warning: This is a browser security warning that can be safely ignored. Authentication should still work properly.');
        console.warn('ℹ️ This warning is caused by Google\'s accounts.google.com sending report-only COOP headers.');
        // Don't throw error for COOP warnings, continue with normal flow
        return;
      }
      
      // Handle backend API errors
      if (error.response) {
        console.error('Backend API error:', error.response.status, error.response.data);
        
        // Handle specific backend error cases
        if (error.response.status === 409) {
          // User already exists - this might happen after account deletion/recreation
          console.log('User already exists, attempting to handle gracefully');
          throw new Error(error.response.data.details || 'Account already exists. Please try logging in instead.');
        } else if (error.response.status === 500) {
          // Server error - provide more helpful message
          const serverError = error.response.data.details || error.response.data.error || 'Server error occurred';
          console.error('Server error details:', serverError);
          throw new Error(`Server error: ${serverError}. Please try again or contact support if the issue persists.`);
        } else if (error.response.status === 400) {
          // Bad request - validation error
          throw new Error(error.response.data.details || error.response.data.error || 'Invalid user data');
        }
      }
      
      let errorMessage = error.response?.data?.error || error.message || 'Google login failed';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login cancelled by user';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup blocked by browser. Please allow popups and try again';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Another popup is already open. Please close it and try again';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google sign-in is not enabled. Please contact support';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized for Google sign-in';
          break;
        default:
          errorMessage = error.message || 'Google login failed';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Firebase Logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add new async thunk for Firestore sync
export const syncUserWithFirestore = createAsyncThunk(
  'auth/syncUserWithFirestore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      
      if (!user || !user.uid) {
        throw new Error('No user data to sync');
      }
      
      // Sync current user data to Firestore
      const syncedUser = await userService.syncUserToFirestore(user.uid, user);
      
      // Update localStorage with synced data
      localStorage.setItem('user', JSON.stringify(syncedUser));
      
      return syncedUser;
    } catch (error) {
      console.error('Firestore sync error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Add new async thunk to load user from Firestore
export const loadUserFromFirestore = createAsyncThunk(
  'auth/loadUserFromFirestore',
  async (userId, { rejectWithValue }) => {
    try {
      const userData = await userService.getUserProfile(userId);
      
      if (userData) {
        // Update localStorage with Firestore data
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Load user from Firestore error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Initialize state with localStorage data
const getInitialUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

const initialUserData = getInitialUserData();

const initialState = {
  user: initialUserData,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),
  error: null,
  phoneVerification: {
    isVerifying: false,
    confirmationResult: null,
    phone: null,
  },
  profileCompleted: initialUserData?.profileCompleted || false,
  userType: initialUserData?.userType || initialUserData?.role || null,
};

// Add async thunk to initialize auth state from backend
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }
      
      // Fetch current user data from backend
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // If token is invalid, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(error.response?.data?.message || 'Authentication failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.profileCompleted = false;
      state.userType = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.profileCompleted = user?.profileCompleted || false;
      state.userType = user?.userType || user?.role || null;
    },
    setUserType: (state, action) => {
      state.userType = action.payload;
    },
    setProfileCompleted: (state, action) => {
      state.profileCompleted = action.payload;
      if (state.user) {
        state.user.profileCompleted = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Phone verification
      .addCase(verifyPhone.pending, (state) => {
        state.phoneVerification.isVerifying = true;
        state.error = null;
      })
      .addCase(verifyPhone.fulfilled, (state, action) => {
        state.phoneVerification.isVerifying = false;
        state.phoneVerification.confirmationResult = action.payload.confirmationResult;
        state.phoneVerification.phone = action.payload.phone;
      })
      .addCase(verifyPhone.rejected, (state, action) => {
        state.phoneVerification.isVerifying = false;
        state.error = action.payload;
      })
      // OTP verification
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.phoneVerification.confirmationResult = null;
        state.phoneVerification.phone = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Extract user data from the response
        const userData = action.payload.user || action.payload;
        state.user = userData;
        state.isAuthenticated = true;
        state.profileCompleted = userData?.profileCompleted || false;
        state.userType = userData?.userType || userData?.role || 'worker';
      })
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const userData = action.payload.user || action.payload;
          state.user = userData;
          state.isAuthenticated = true;
          state.profileCompleted = userData?.profileCompleted || false;
          state.userType = userData?.userType || userData?.role || 'worker';
          
          // Update localStorage with fresh user data from backend
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.profileCompleted = false;
          state.userType = null;
        }
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.profileCompleted = false;
        state.userType = null;
        state.error = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      })
      // Firebase Email Registration
      .addCase(registerWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Firebase Email Login
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        // Use actual profileCompleted value from backend instead of hardcoding to true
        state.profileCompleted = action.payload.user?.profileCompleted || false;
        // Set userType from backend data
        state.userType = action.payload.user?.userType || action.payload.user?.role || 'worker';
        
        // Update localStorage with the actual user data from backend
        if (action.payload.user) {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Firebase Google Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Debug logging
        console.log('Google login fulfilled - payload:', action.payload);
        console.log('Google login fulfilled - user object:', action.payload.user);
        console.log('Google login fulfilled - hasPassword:', action.payload.user?.hasPassword);
        
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        // Use actual profileCompleted value from backend instead of hardcoding to true
        state.profileCompleted = action.payload.user?.profileCompleted || false;
        // Set userType from backend data
        state.userType = action.payload.user?.userType || action.payload.user?.role || 'worker';
        
        // Update localStorage with the actual user data from backend
        if (action.payload.user) {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Firebase Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.profileCompleted = false;
        state.userType = null;
      })
      // Firebase Google Redirect Login
      .addCase(loginWithGoogleRedirect.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogleRedirect.fulfilled, (state) => {
        state.isLoading = false;
        // Redirect is in progress, actual login will be handled on page reload
      })
      .addCase(loginWithGoogleRedirect.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Ensure user has password flag set to true after changing password
        if (state.user) {
          state.user.hasPassword = true;
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Set Password
      .addCase(setPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Update user to indicate they now have a password
        if (state.user) {
          state.user.hasPassword = true;
        }
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setCredentials, setUserType, setProfileCompleted } = authSlice.actions;
export default authSlice.reducer;