import { useQuery } from "@tanstack/react-query";
import { getOrganizationUnits } from "@/services/organizationUnit.service";

export const useOrganizationUnits = () => {
  return useQuery({
    queryKey: ["organization-units"],
    queryFn: getOrganizationUnits,
  });
};