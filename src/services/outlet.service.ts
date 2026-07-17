import axios from "@/lib/axios";
import { OutletResponse } from "@/types/outlet";

export const getOutlets = async (
  organizationUnitId?: number
) => {
  const response =
    await axios.get<OutletResponse>(
      "/outlets",
      {
        params: {
          organization_unit_id:
            organizationUnitId,
        },
      }
    );

  return response.data;
};