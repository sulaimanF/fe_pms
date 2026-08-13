import { useQuery } from "@tanstack/react-query";
import { getOutlets } from "@/services/outlet.service";

export const useOutlets = (
  organizationUnitId?: number
) => {
  return useQuery({
    queryKey: ["outlets", organizationUnitId],
    queryFn: () => getOutlets(organizationUnitId),
    enabled: !!organizationUnitId,
  });
};

export const useAllOutlets = () => {
  return useQuery({
    queryKey: ["outlets"],
    queryFn: () => getOutlets(),
  });
};