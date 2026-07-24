import axios from "@/lib/axios";
import { MenuTreeResponse } from "@/types/menu";

export const getMenuTree = async () => {
  const { data } = await axios.get<MenuTreeResponse>("/menus/tree");
  return data;
};