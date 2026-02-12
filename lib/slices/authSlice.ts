import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrate: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        state.token = token;
        state.user = userStr ? JSON.parse(userStr) : null;
      }
      state.hydrated = true;
    },
    setCredentials: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { hydrate, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
