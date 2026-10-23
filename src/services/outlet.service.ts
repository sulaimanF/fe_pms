import axios from "@/lib/axios";
import type { Outlet } from "@/types/outlet";
import type { ApiResponse } from "@/types/common";
import { collectPages } from "@/lib/managementApi";

export const getOutlets = async (
  organizationUnitId?: number,
  page?: number
) => {
  const response =
    await axios.get<ApiResponse<Outlet[]>>(
      "/outlets",
      {
        params: {
          organization_unit_id:
            organizationUnitId,
          ...(page ? { page, per_page: 100 } : {}),
        },
      }
    );

  return response.data;
};

export const getAllOutlets = () => collectPages((page) => getOutlets(undefined, page));
