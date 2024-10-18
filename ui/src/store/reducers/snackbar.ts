///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

/* eslint-disable */
import { createSlice } from '@reduxjs/toolkit';

// types
import { SnackbarProps } from '../../types/snackbar';

const initialState: SnackbarProps = {
  action: false,
  open: false,
  message: 'Note archived',
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'right',
  },
  variant: 'default',
  alert: {
    color: 'primary',
    variant: 'filled',
  },
  transition: 'Fade',
  close: true,
  actionButton: false,
  maxStack: 3,
  dense: false,
  iconVariant: 'usedefault',
};

// ==============================|| SLICE - SNACKBAR ||============================== //

const snackbar = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    openSnackbar(state, action) {
      const {
        open,
        message,
        anchorOrigin,
        variant,
        alert,
        transition,
        close,
        actionButton,
      } = action.payload;

      state.action = !state.action;
      state.open = open || initialState.open;
      state.message = message || initialState.message;
      state.anchorOrigin = anchorOrigin || initialState.anchorOrigin;
      state.variant = variant || initialState.variant;
      state.alert = {
        color: alert?.color || initialState.alert.color,
        variant: alert?.variant || initialState.alert.variant,
      };
      state.transition = transition || initialState.transition;
      state.close = close === false ? close : initialState.close;
      state.actionButton = actionButton || initialState.actionButton;
    },

    closeSnackbar(state) {
      state.open = false;
    },

    handlerIncrease(state, action) {
      const { maxStack } = action.payload;
      state.maxStack = maxStack;
    },
    handlerDense(state, action) {
      const { dense } = action.payload;
      state.dense = dense;
    },
    handlerIconVariants(state, action) {
      const { iconVariant } = action.payload;
      state.iconVariant = iconVariant;
    },
  },
});

export default snackbar.reducer;

export const {
  closeSnackbar,
  openSnackbar,
  handlerIncrease,
  handlerDense,
  handlerIconVariants,
} = snackbar.actions;
