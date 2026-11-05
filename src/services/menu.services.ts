import axios from "@/lib/axios";
import type { MenuTreeResponse, MenuCatalogResponse } from "@/types/menu";
import { collectPages } from "@/lib/managementApi";

export const getMenuTree = async () => {
  const { data } = await axios.get<MenuTreeResponse>("/menus/tree");
  return data;
};

export const getAllMenus = () => collectPages(async (page) =>
  (await axios.get<MenuCatalogResponse>("/menus", { params: { page, per_page: 200 } })).data);
