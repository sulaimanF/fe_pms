import api from "@/lib/axios";
import type { ApiResponse } from "@/types/common";
import type { AuthUser } from "@/types/auth";

export const getMe = async () => {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return response.data;
}

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};