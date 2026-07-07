import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertProps } from '@inithium/types';

export interface AlertState {
  current: AlertProps | null;
}

const initialState: AlertState = {
  current: null,
};

export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<Omit<AlertProps, 'open'>>) => {
      state.current = { ...action.payload, open: true };
    },
    hideAlert: (state) => {
      if (state.current) {
        state.current.open = false;
      }
    },
    clearAlert: (state) => {
      state.current = null;
    },
  },
});

export const { showAlert, hideAlert, clearAlert } = alertSlice.actions;