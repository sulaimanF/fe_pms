import axios from "@/lib/axios";
import { RoleResponse } from "@/types/role";

export const getRoles = async () => {
  const response = await axios.get<RoleResponse>("/roles");
  return response.data;
};

export const deleteRole = async (id: number) => {
  const response = await axios.delete(`/roles/${id}`);
  return response.data;
};