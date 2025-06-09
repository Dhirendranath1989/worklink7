import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { jobsAPI } from '../../services/api';

// Async thunks
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ id, jobData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/jobs/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const applyToJob = createAsyncThunk(
  'jobs/applyToJob',
  async ({ jobId, applicationData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/jobs/${jobId}/apply`, applicationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchJobApplications = createAsyncThunk(
  'jobs/fetchJobApplications',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/jobs/${jobId}/applications`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'jobs/updateApplicationStatus',
  async ({ jobId, applicationId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/jobs/${jobId}/applications/${applicationId}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const searchWorkers = createAsyncThunk(
  'jobs/searchWorkers',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await jobsAPI.searchWorkers(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const saveSearch = createAsyncThunk(
  'jobs/saveSearch',
  async (searchData, { rejectWithValue }) => {
    try {
      const response = await api.post('/saved-searches', searchData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

export const fetchSavedSearches = createAsyncThunk(
  'jobs/fetchSavedSearches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/saved-searches');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const initialState = {
  jobs: [],
  currentJob: null,
  applications: [],
  searchResults: [],
  savedSearches: [],
  isLoading: false,
  error: null,
  filters: {
    skill: '',
    location: '',
    radius: 10,
    minRating: 0,
    experience: '',
    availability: false,
    sortBy: 'relevance',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.jobs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update job
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(job => job._id === action.payload._id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
      })
      // Delete job
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter(job => job._id !== action.payload);
      })
      // Search workers
      .addCase(searchWorkers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchWorkers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.workers;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchWorkers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Saved searches
      .addCase(fetchSavedSearches.fulfilled, (state, action) => {
        state.savedSearches = action.payload;
      })
      .addCase(saveSearch.fulfilled, (state, action) => {
        state.savedSearches.unshift(action.payload);
      })
      // Job applications
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.applications = action.payload;
      })
      .addCase(applyToJob.fulfilled, (state, action) => {
        state.applications.push(action.payload);
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const index = state.applications.findIndex(app => app._id === action.payload._id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      });
  },
});

export const { setFilters, clearFilters, setCurrentJob, clearError, setPagination } = jobsSlice.actions;
export default jobsSlice.reducer;