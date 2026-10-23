import api from "@/lib/axios";
import { collectPages } from "@/lib/managementApi";
import type { OrganizationUnitResponse } from "@/types/organizationUnit";
export const getOrganizationUnits = async (page?: number) => (await api.get<OrganizationUnitResponse>("/organizations", { params: page ? { page, per_page: 100 } : undefined })).data;
export const getAllOrganizationUnits = () => collectPages(getOrganizationUnits);
