import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchProfile = createAsyncThunk(
  'profiles/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profiles/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/update-profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const uploadProfileImage = createAsyncThunk(
  'profiles/uploadProfileImage',
  async (imageFile, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', imageFile);
      const response = await api.put('/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const addPortfolioItem = createAsyncThunk(
  'profiles/addPortfolioItem',
  async (portfolioData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/update-profile', portfolioData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updatePortfolioItem = createAsyncThunk(
  'profiles/updatePortfolioItem',
  async ({ id, portfolioData }, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/update-profile', portfolioData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const deletePortfolioItem = createAsyncThunk(
  'profiles/deletePortfolioItem',
  async (id, { rejectWithValue }) => {
    try {
      await api.put('/auth/update-profile', { removePortfolioItem: id });
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateAvailability = createAsyncThunk(
  'profiles/updateAvailability',
  async (availabilityData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/update-profile', { availability: availabilityData });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);



export const fetchEarnings = createAsyncThunk(
  'profiles/fetchEarnings',
  async (period, { rejectWithValue }) => {
    try {
      const response = await api.get(`/profiles/earnings?period=${period}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const initialState = {
  currentProfile: null,
  viewedProfile: null,
  portfolio: [],

  earnings: {
    total: 0,
    thisMonth: 0,
    thisWeek: 0,
    jobs: [],
  },
  availability: {
    isAvailable: true,
    schedule: {},
    busyDates: [],
  },
  isLoading: false,
  error: null,
  uploadingImage: false,
};

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProfile: (state, action) => {
      state.currentProfile = action.payload;
    },
    updateAvailabilityStatus: (state, action) => {
      if (state.currentProfile) {
        state.currentProfile.isAvailable = action.payload;
      }
    },
    addBusyDate: (state, action) => {
      state.availability.busyDates.push(action.payload);
    },
    removeBusyDate: (state, action) => {
      state.availability.busyDates = state.availability.busyDates.filter(
        date => date !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle nested profile response from backend
        state.viewedProfile = action.payload.profile || action.payload;
        // Also update currentProfile if it's the same user
        if (!state.currentProfile) {
          state.currentProfile = action.payload.profile || action.payload;
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProfile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Upload profile image
      .addCase(uploadProfileImage.pending, (state) => {
        state.uploadingImage = true;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.uploadingImage = false;
        if (state.currentProfile) {
          state.currentProfile.profileImage = action.payload.imageUrl;
        }
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.uploadingImage = false;
        state.error = action.payload;
      })
      // Portfolio management
      .addCase(addPortfolioItem.fulfilled, (state, action) => {
        state.portfolio.push(action.payload);
      })
      .addCase(updatePortfolioItem.fulfilled, (state, action) => {
        const index = state.portfolio.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.portfolio[index] = action.payload;
        }
      })
      .addCase(deletePortfolioItem.fulfilled, (state, action) => {
        state.portfolio = state.portfolio.filter(item => item._id !== action.payload);
      })
      // Availability
      .addCase(updateAvailability.fulfilled, (state, action) => {
        state.availability = action.payload;
        if (state.currentProfile) {
          state.currentProfile.availability = action.payload;
        }
      })

      // Earnings
      .addCase(fetchEarnings.fulfilled, (state, action) => {
        state.earnings = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentProfile,
  updateAvailabilityStatus,
  addBusyDate,
  removeBusyDate,
} = profilesSlice.actions;

export default profilesSlice.reducer;