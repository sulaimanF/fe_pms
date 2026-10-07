import api from "@/lib/axios";
import type { ApiResponse } from "@/types/common";
import type { MeResponse } from "@/types/auth";

export const getMe = async () => {
  const response = await api.get<ApiResponse<MeResponse>>("/auth/me");
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
