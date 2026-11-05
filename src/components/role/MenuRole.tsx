"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useMenuCatalog } from "@/hooks/useMenu";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ACCESS, isForbidden } from "@/lib/authorization";

interface Props {
  selectedMenus: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export default function MenuRole({ selectedMenus, onChange, disabled = false }: Props) {
  const access = useAuthorization(ACCESS.menuCatalog);
  const query = useMenuCatalog();
  if (!access.allowed) return <p role="alert">Katalog menu memerlukan izin menu.viewAny. Assignment yang sudah ada tetap dipertahankan.</p>;
  if (query.error) return <div role="alert">
    <p>{isForbidden(query.error) ? "Akses katalog menu ditolak oleh server." : "Katalog menu gagal dimuat."}</p>
    <Button type="button" variant="outline" onClick={() => { void query.refetch(); }}>Coba lagi</Button>
  </div>;
  if (query.isLoading) return <p role="status">Memuat seluruh katalog menu...</p>;
  const menus = query.data?.data ?? [];
  const visible = menus.filter((menu) => menu.is_active && menu.menu_type !== "divider");
  const byId = new Map(menus.map((menu) => [menu.id, menu]));
  const selected = new Set(selectedMenus);
  if (!visible.length) return <p role="status">Tidak ada menu aktif. Assignment lama tetap dipertahankan.</p>;
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Menu mengatur navigasi sidebar; permission mengatur hak aksi. Untuk item dalam group, pilih juga group induknya.</p>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {visible.map((menu) => {
        const parent = menu.parent_id !== null ? byId.get(menu.parent_id) : undefined;
        const supported = menu.parent_id === null || (menu.menu_type === "item" && parent?.is_active && parent.menu_type === "group" && parent.parent_id === null);
        return <label key={menu.id} className="flex items-start gap-3 rounded-xl border p-3">
          <Checkbox aria-label={`Menu ${menu.label}`} checked={selected.has(menu.id)} disabled={disabled || !supported}
            onCheckedChange={(checked) => {
              if (disabled || !supported) return;
              const next = new Set(selected);
              if (checked === true) next.add(menu.id); else next.delete(menu.id);
              onChange([...next]);
            }} />
          <span><span className="block">{parent ? `${parent.label} / ` : ""}{menu.label}</span>
            <span className="block text-xs text-muted-foreground">{menu.menu_type === "group" ? "Group" : menu.route_path ?? menu.code}</span>
            {!supported && <span className="block text-xs text-muted-foreground">Struktur ini belum ditampilkan sidebar backend; assignment lama dipertahankan.</span>}
          </span>
        </label>;
      })}
    </div>
    <p className="text-sm text-muted-foreground">Assignment yang tidak tersedia dalam pilihan aktif tidak dihapus otomatis.</p>
  </div>;
}
