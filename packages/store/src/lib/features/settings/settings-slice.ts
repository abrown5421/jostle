import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { Setting } from '@inithium/types';
import { settingsApi } from './settings-api';
import { RootState } from '../../../store';

export interface SettingsState {
  items: Setting[];
}

const initialState: SettingsState = {
  items: [],
};

const apiEndpoints = settingsApi.endpoints as any;

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(
        apiEndpoints.readAllSettings.matchFulfilled,
        (state, action: any) => {
          state.items = action.payload;
        }
      )
      .addMatcher(
        apiEndpoints.readOneSetting.matchFulfilled,
        (state, action: any) => {
          const index = state.items.findIndex(item => item._id === action.payload._id);
          if (index !== -1) {
            state.items[index] = action.payload;
          } else {
            state.items.push(action.payload);
          }
        }
      )
      .addMatcher(
        apiEndpoints.updateOneSetting.matchFulfilled,
        (state, action: any) => {
          const index = state.items.findIndex(item => item._id === action.payload._id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      );
  },
});

const selectSettingsState = (state: RootState) => state[settingsSlice.name];

export const selectAllSettings = createSelector(
  [selectSettingsState],
  (settings) => settings.items
);

export const selectSettingByKey = (key: string) =>
  createSelector(
    [selectAllSettings],
    (items) => items.find((setting) => (setting as any).key === key)
  );