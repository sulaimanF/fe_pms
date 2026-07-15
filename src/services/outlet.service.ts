import axios from "@/lib/axios";

export const getOutlets = async (organizationUnitId?: number) => {
  const { data } = await axios.get("/outlets", {
    params: {
      organization_unit_id: organizationUnitId,
    },
  });

  return data;
};