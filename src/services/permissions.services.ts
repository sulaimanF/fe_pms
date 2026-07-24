import axios from "@/lib/axios";
import { PermissionResponse } from "@/types/permissions";

export const getPermissions = async () => {
  const { data } = await axios.get<PermissionResponse>("/permissions");
  return data;
};