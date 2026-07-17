import axios from "@/lib/axios";
import { OrganizationUnitResponse } from "@/types/organizationUnit";

export const getOrganizationUnits = async () => {
  const response = await axios.get<OrganizationUnitResponse>("/organization-units");
  return response.data;
};