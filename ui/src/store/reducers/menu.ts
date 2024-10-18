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
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// project import
import axios from 'axios';

// types
import { MenuProps } from '../../types/menu';

// initial state
const initialState: MenuProps = {
  openItem: ['dashboard'],
  openComponent: 'buttons',
  selectedID: null,
  drawerOpen: false,
  componentDrawerOpen: true,
  menu: {},
  error: null,
};

// ==============================|| SLICE - MENU ||============================== //

export const fetchMenu = createAsyncThunk('', async () => {
  const response = await axios.get('/api/menu/dashboard');
  return response.data;
});

const menu = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    activeItem(state, action) {
      state.openItem = action.payload.openItem;
    },

    activeID(state, action) {
      state.selectedID = action.payload;
    },

    activeComponent(state, action) {
      state.openComponent = action.payload.openComponent;
    },

    openDrawer(state, action) {
      state.drawerOpen = action.payload;
    },

    openComponentDrawer(state, action) {
      state.componentDrawerOpen = action.payload.componentDrawerOpen;
    },

    hasError(state, action) {
      state.error = action.payload;
    },
  },

  extraReducers(builder) {
    builder.addCase(fetchMenu.fulfilled, (state, action) => {
      state.menu = action.payload.dashboard;
    });
  },
});

export default menu.reducer;

export const {
  activeItem,
  activeComponent,
  openDrawer,
  openComponentDrawer,
  activeID,
} = menu.actions;
