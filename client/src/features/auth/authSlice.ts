import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearSession, getStoredUser } from "../../lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const initialState: AuthState = {
  user: getStoredUser<User>(),
  isAuthenticated: Boolean(localStorage.getItem("sidebooking_token")),
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      clearSession();
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
