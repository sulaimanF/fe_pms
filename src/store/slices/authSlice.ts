import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse, AuthUser, LoginResponse } from "@/types/auth";

interface AuthState {
  reference: string | null;
  expires_in: number | null;
  sent_to: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_type: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  reference: null,
  expires_in: null,
  sent_to: null,
  access_token: null,
  refresh_token: null,
  token_type: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // simpan data login sementara
    setOtpData: (
      state,
      action: PayloadAction<LoginResponse>
    ) => {
      state.reference = action.payload.reference;
      state.expires_in = action.payload.expires_in;
      state.sent_to = action.payload.sent_to;
    },

    // Simpan token setelah OTP berhasil
    setAuthData: (
      state,
      action: PayloadAction<AuthResponse>
    ) => {
      state.access_token = action.payload.access_token;
      state.refresh_token = action.payload.refresh_token;
      state.expires_in = action.payload.expires_in;
      state.token_type = action.payload.token_type;
      state.user = action.payload.user;
      state.isAuthenticated = true;

      state.reference = null;
      state.expires_in = null;
      state.sent_to = null;
    },

    // Logout
    logout: (state) => {
      state.reference = null;
      state.expires_in = null;
      state.sent_to = null;

      state.access_token = null;
      state.refresh_token = null;
      state.token_type = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  setOtpData,
  setAuthData,
  logout,
} = authSlice.actions;

export default authSlice.reducer;