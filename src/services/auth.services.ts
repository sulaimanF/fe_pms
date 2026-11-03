import api from "@/lib/axios";
import type { ApiResponse } from "@/types/common";
import type { MeResponse, OtpVerificationResponse } from "@/types/auth";
import type { SessionContext } from "@/lib/session";

export function readOtpCredentials(response: unknown): Pick<OtpVerificationResponse, "token" | "token_type"> {
  if (!response || typeof response !== "object" || !("success" in response) || response.success !== true ||
    !("data" in response) || !response.data || typeof response.data !== "object") {
    throw new Error("Invalid OTP verification response.");
  }
  const data = response.data;
  if (!("token" in data) || typeof data.token !== "string" || !data.token.trim() ||
    !("token_type" in data) || data.token_type !== "Bearer" ||
    !("user" in data) || !data.user || typeof data.user !== "object" ||
    !("id" in data.user) || typeof data.user.id !== "number" ||
    !Number.isSafeInteger(data.user.id) || data.user.id <= 0) {
    throw new Error("Incomplete OTP credentials.");
  }
  return { token: data.token, token_type: data.token_type };
}

// Only the initial OTP profile request delegates failures to the login rollback.
export const getMe = async (loginAttempt?: SessionContext) => {
  const response = await api.get<ApiResponse<MeResponse>>("/auth/me", {
    sessionContext: loginAttempt,
    sessionMode: loginAttempt ? "login-profile" : undefined,
  });
  if (response.data?.success !== true) throw new Error("Profile request was not successful.");
  return response.data;
}

export const logout = async (token: string) => {
  const response = await api.post<ApiResponse<null>>("/auth/logout", undefined, {
    sessionMode: "revoke",
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10_000,
  });
  if (response.status !== 200 || response.data?.success !== true || response.data.http_code !== 200 || response.data.data !== null) {
    throw new Error("Token revocation was not confirmed by the server.");
  }
  return response.data;
};
