import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import jobsReducer from '../features/jobs/jobsSlice';
import profilesReducer from '../features/profiles/profilesSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';

import savedWorkersReducer from '../features/savedWorkers/savedWorkersSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};

const rootReducer = combineReducers({
  auth: authReducer,
  jobs: jobsReducer,
  profiles: profilesReducer,
  notifications: notificationsReducer,

  savedWorkers: savedWorkersReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;