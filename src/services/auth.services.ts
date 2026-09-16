import api from "@/lib/axios";
import type { ApiResponse } from "@/types/common";
import type { MeResponse } from "@/types/auth";

export const getMe = async () => {
  const response = await api.get<ApiResponse<MeResponse>>("/auth/me");
  return response.data;
}

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};