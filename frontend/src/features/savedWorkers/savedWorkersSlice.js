import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchSavedWorkers = createAsyncThunk(
  'savedWorkers/fetchSavedWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/saved-workers');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch saved workers');
    }
  }
);

export const saveWorker = createAsyncThunk(
  'savedWorkers/saveWorker',
  async (workerId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/saved-workers/${workerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save worker');
    }
  }
);

export const removeSavedWorker = createAsyncThunk(
  'savedWorkers/removeSavedWorker',
  async (workerId, { rejectWithValue }) => {
    try {
      await api.delete(`/saved-workers/${workerId}`);
      return workerId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove saved worker');
    }
  }
);

export const checkIfWorkerSaved = createAsyncThunk(
  'savedWorkers/checkIfWorkerSaved',
  async (workerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/saved-workers/check/${workerId}`);
      return { workerId, isSaved: response.data.isSaved };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check worker status');
    }
  }
);

const initialState = {
  savedWorkers: [],
  isLoading: false,
  error: null,
  checkedWorkers: {}, // Track which workers are saved for quick lookup
};

const savedWorkersSlice = createSlice({
  name: 'savedWorkers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetSavedWorkers: (state) => {
      state.savedWorkers = [];
      state.checkedWorkers = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch saved workers
      .addCase(fetchSavedWorkers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSavedWorkers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle the response structure { success: true, savedWorkers: [...] }
        const savedWorkers = action.payload.savedWorkers || action.payload;
        state.savedWorkers = Array.isArray(savedWorkers) ? savedWorkers : [];
        // Update checkedWorkers for quick lookup
        state.checkedWorkers = {};
        if (Array.isArray(savedWorkers)) {
          savedWorkers.forEach(worker => {
            state.checkedWorkers[worker._id || worker.id] = true;
          });
        }
      })
      .addCase(fetchSavedWorkers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Save worker
      .addCase(saveWorker.pending, (state) => {
        state.error = null;
      })
      .addCase(saveWorker.fulfilled, (state, action) => {
        // Handle the response structure { success: true, message: '...', worker: {...} }
        const worker = action.payload.worker || action.payload;
        if (worker && (worker._id || worker.id)) {
          state.savedWorkers.push(worker);
          state.checkedWorkers[worker._id || worker.id] = true;
        }
      })
      .addCase(saveWorker.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove saved worker
      .addCase(removeSavedWorker.pending, (state) => {
        state.error = null;
      })
      .addCase(removeSavedWorker.fulfilled, (state, action) => {
        const workerId = action.payload;
        state.savedWorkers = state.savedWorkers.filter(
          worker => (worker._id || worker.id) !== workerId
        );
        delete state.checkedWorkers[workerId];
      })
      .addCase(removeSavedWorker.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Check if worker is saved
      .addCase(checkIfWorkerSaved.fulfilled, (state, action) => {
        const { workerId, isSaved } = action.payload;
        state.checkedWorkers[workerId] = isSaved;
      });
  },
});

export const { clearError, resetSavedWorkers } = savedWorkersSlice.actions;

export default savedWorkersSlice.reducer;