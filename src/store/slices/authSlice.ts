import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse, AuthUser, LoginOtpData } from "@/types/auth";

interface AuthState {
  login: string | null;
  reference: string | null;
  expires_in: number | null;
  expired_at: number | null;
  sent_to: string | null;
  token: string | null;
  token_type: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  login: null,
  reference: null,
  expires_in: null,
  expired_at: null,
  sent_to: null,
  token: null,
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
      action: PayloadAction<LoginOtpData>
    ) => {
      state.reference = action.payload.reference;
      state.expires_in = action.payload.expires_in;
      state.sent_to = action.payload.sent_to;
      state.login = action.payload.login;
      // waktu OTP berakhir
      state.expired_at = Date.now() + action.payload.expires_in * 1000;
    },

    // Simpan token setelah OTP berhasil
    // setAuthData: (
    //   state,
    //   action: PayloadAction<AuthResponse>
    // ) => {
    //   state.token = action.payload.token;
    //   state.token_type = action.payload.token_type;
    //   state.user = action.payload.user;
    //   state.isAuthenticated = true;
    // },

    setToken(
      state,
      action: PayloadAction<{
        token: string;
        token_type: string;
      }>
    ) {
      state.token = action.payload.token;
      state.token_type = action.payload.token_type;
      state.isAuthenticated = true;
      state.login = null;
      state.reference = null;
      state.expires_in = null;
      state.sent_to = null;
      state.expired_at = null;
    },

    setUser(
      state,
      action: PayloadAction<AuthUser>
    ) {
      state.user = action.payload;
    },

    // Logout
    logout: (state) => {
      state.login = null;
      state.reference = null;
      state.expires_in = null;
      state.expired_at = null;
      state.sent_to = null;

      state.token = null;
      state.token_type = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  setOtpData,
  setToken,
  setUser,
  logout,
} = authSlice.actions;

export default authSlice.reducer;