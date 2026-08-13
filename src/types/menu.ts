export interface Menu {
  id: number;
  parent_id: number | null;
  code: string;
  label: string;
  icon: string;
  route_name: string | null;
  route_path: string | null;
  menu_type: "group" | "item";
  sort_order: number;
  is_active: boolean;
  children: Menu[];
}

export interface MenuTree {
  id: number;
  parent_id: number | null;
  code: string;
  label: string;
  icon: string | null;
  route_name: string | null;
  route_path: string | null;
  menu_type: "item" | "group";
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children: MenuTree[];
}

export interface MenuTreeResponse {
  success: boolean;
  http_code: number;
  message: string;
  data: MenuTree[];
}