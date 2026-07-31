"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMenuTree } from "@/hooks/useMenu";
import { usePermissions } from "@/hooks/usePermissions";
import type { MenuTree } from "@/types/menu";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRoles";

interface RoleFormProps {
  mode: "create" | "update";
  roleId?: number;
}

export default function RoleForm({
  mode,
  roleId,
}: RoleFormProps) {
  console.log("mode:", mode);
  console.log("roleId:", roleId);
  const router = useRouter();
  const { data: roleData, isLoading: roleLoading } = useRole(
    mode === "update" ? roleId : undefined
  );
  console.log(roleData);
  const { data: menuData, isLoading: menuLoading } = useMenuTree();
  const { data: permissionData, isLoading: permissionLoading } = usePermissions();
  const menus = menuData?.data ?? [];
  const [activeTab, setActiveTab] = useState("");

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (mode === "update" && roleData?.data) {
      setRoleName(roleData.data.name);
      setDescription(roleData.data.description ?? "");
    }
  }, [mode, roleData]);

  useEffect(() => {
    if (!activeTab && menus.length > 0) {
      setActiveTab(menus[0].code);
    }
  }, [menus, activeTab]);

  const renderRows = (
    menus: MenuTree[],
    level = 0
  ): React.ReactNode[] => {
    return menus.flatMap((menu) => {
      const rows: React.ReactNode[] = [];

      // hanya render kalau bukan group
      if (menu.menu_type !== "group") {
        rows.push(
          <tr key={menu.id} className="border-b h-14">
            <td className="px-6">
              <div
                className="flex items-center"
                style={{ paddingLeft: `${level * 24}px` }}
              >
                {menu.label}
              </div>
            </td>

            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox />
              </div>
            </td>

            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox />
              </div>
            </td>

            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox />
              </div>
            </td>

            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox />
              </div>
            </td>

            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox />
              </div>
            </td>
          </tr>
        );
      }

      rows.push(...renderRows(menu.children ?? [], level + 1));

      return rows;
    });
  };

  if (
    menuLoading ||
    permissionLoading ||
    (mode === "update" && roleLoading)
  ) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              className="h-14 rounded-xl"
              placeholder="Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />

            <Input
              className="h-14 rounded-xl"
              placeholder="Description Role"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-lg">
        <CardContent className="min-h-[550px] p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList
              variant="line"
              className="
                w-full
                h-10
                justify-start
                rounded-none
                bg-transparent
                p-0
              "
            >
              {menus.map((menu) => (
                <TabsTrigger
                  key={menu.id}
                  value={menu.code}
                  className="
                    relative
                    h-10
                    rounded-none
                    text-[15px]
                    font-medium
                    data-active:text-blue-600
                    data-active:after:bg-blue-600
                    data-active:after:h-[3px]
                    data-active:after:opacity-100
                  "
                >
                  {menu.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {menus.map((menu) => (
              <TabsContent
                key={menu.id}
                value={menu.code}
                className="m-0"
              >
                <table className="w-full">
                  <thead>
                    <tr className="h-12">
                      <th className="w-[20%] text-left px-6">Name</th>
                      <th className="text-center">All Access</th>
                      <th className="text-center">View</th>
                      <th className="text-center">Create</th>
                      <th className="text-center">Update</th>
                      <th className="text-center">Delete</th>
                    </tr>
                  </thead>

                  <tbody>

                    {renderRows([menu])}

                  </tbody>
                </table>
              </TabsContent>
            ))}
          </Tabs>

        </CardContent>
      </Card>
      {/* Card Permission nanti */}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          className="rounded-lg border border-gray-300 px-15 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => router.push("/roleManagement")}
        >
          Cancel
        </Button>

        <Button
          className="rounded-lg bg-blue-600 px-15 py-2 text-sm text-white hover:bg-blue-700"
        >
          {mode === "create" ? "Save" : "Update"}
        </Button>
      </div>
    </div>
  );
}