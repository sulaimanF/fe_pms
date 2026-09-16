import axios from "@/lib/axios";
import {   RoleListResponse, RoleDetailResponse } from "@/types/role";

export const getRoles = async () => {
  const response = await axios.get<RoleListResponse>("/roles");
  return response.data;
};

export const getRoleById = async (id: number | string): Promise<RoleDetailResponse> => {
  const response = await axios.get(`/roles/${id}`);
  return response.data;
}

export const deleteRole = async (id: number) => {
  const response = await axios.delete(`/roles/${id}`);
  return response.data;
};