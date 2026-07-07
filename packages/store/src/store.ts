import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './lib/base';
import { activeUserSlice } from './lib/features/active-user/active-user-slice';
import { alertSlice } from './lib/features/alert/alert-slice';
import { settingsSlice } from './lib/features/settings/settings-slice';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  [activeUserSlice.name]: activeUserSlice.reducer,
  [alertSlice.name]: alertSlice.reducer,
  [settingsSlice.name]: settingsSlice.reducer,
});

export const createInithiumStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(baseApi.middleware as any),
    preloadedState,
    devTools: process.env['NODE_ENV'] !== 'production',
  });

  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof createInithiumStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];