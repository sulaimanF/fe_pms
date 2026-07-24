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

export interface MenuTreeResponse {
  success: boolean;
  message: string;
  data: Menu[];
}