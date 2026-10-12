import api from "@/lib/axios";
import type { ApiResponse } from "@/types/common";
import type { MeResponse } from "@/types/auth";
import type { SessionContext } from "@/lib/session";

// Only the initial OTP profile request delegates failures to the login rollback.
export const getMe = async (loginAttempt?: SessionContext) => {
  const response = await api.get<ApiResponse<MeResponse>>("/auth/me", {
    sessionContext: loginAttempt,
    sessionMode: loginAttempt ? "login-profile" : undefined,
  });
  return response.data;
}

export const logout = async (token: string) => {
  const response = await api.post("/auth/logout", undefined, {
    sessionMode: "revoke",
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10_000,
  });
  return response.data;
};
