import api from "@/lib/axios";
import { collectPages } from "@/lib/managementApi";
import type { PermissionResponse } from "@/types/permissions";
export const getPermissions = () => collectPages(async (page) => (await api.get<PermissionResponse>("/permissions", { params: { page, per_page: 200 } })).data);
