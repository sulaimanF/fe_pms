import axios from "@/lib/axios";
import { RoleResponse } from "@/types/role";

export const getRoles = async () => {
  const response =
    await axios.get<RoleResponse>("/roles");

  return response.data;
};