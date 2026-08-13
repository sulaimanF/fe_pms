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
  const {
    data: roleData,
    isLoading: roleLoading
  } = useRole(
    mode === "update" ? roleId : undefined
  );
  // console.log(roleData);
  const { data: menuData, isLoading: menuLoading } = useMenuTree();
  const { data: permissionData, isLoading: permissionLoading } = usePermissions();
  
  const menus = menuData?.data ?? [];
  // const permissions = permissionData?.data ?? [];
  const permissions = (permissionData?.data ?? []).filter(
    (permission) => permission.is_active
  );

  const menuPermissionModule: Record<string, string> = {
    "user-list": "user",
    "role-list": "role",
    "org-unit-list": "org-unit",
    "outlet-list": "outlet",
    "report-summary": "report",
    "report-audit": "audit",
    "api-keys": "api-key",
    settings: "setting",
  };

  const getMenuPermissions = (menu: MenuTree) => {
    const module = menuPermissionModule[menu.code];

    if (!module) {
      return [];
    }

    return permissions.filter(
      (permission) => permission.module === module
    );
  };

  const getPermission = (
    menu: MenuTree,
    action: string
  ) => {
    const menuPermissions = getMenuPermissions(menu);

    return menuPermissions.find(
      (permission) => permission.action === action
    );
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((current) => {
      if (current.includes(permissionId)) {
        return current.filter((id) => id !== permissionId);
      }

      return [...current, permissionId];
    });
  };

  const toggleAllAccess = (menu: MenuTree) => {
    const menuPermissions = getMenuPermissions(menu);

    const permissionIds = menuPermissions.map(
      (permission) => permission.id
    );

    const allSelected = permissionIds.every((id) =>
      selectedPermissions.includes(id)
    );

    setSelectedPermissions((current) => {
      if (allSelected) {
        return current.filter(
          (id) => !permissionIds.includes(id)
        );
      }

      return Array.from(
        new Set([...current, ...permissionIds])
      );
    });
  };

  const isAllAccessSelected = (menu: MenuTree) => {
    const menuPermissions = getMenuPermissions(menu);

    if (menuPermissions.length === 0) {
      return false;
    }

    return menuPermissions.every((permission) =>
      selectedPermissions.includes(permission.id)
    );
  };

  // console.log("MENUS:", menus);
  // console.log("PERMISSIONS:", permissions);
  // console.log("ROLE PERMISSIONS:", roleData?.data?.permissions);

  const [activeTab, setActiveTab] = useState("");
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // const permissionActions = {
  //   view: "view",
  //   create: "create",
  //   update: "update",
  //   delete: "delete",
  // };

  useEffect(() => {
    if (mode === "update" && roleData?.data) {
      setRoleName(roleData.data.name);
      setDescription(roleData.data.description ?? "");

      setSelectedPermissions(
        roleData.data.permissions.map((permission) => permission.id)
      );
    }
  }, [mode, roleData]);

  const isPermissionSelected = (permissionId: number) => {
    return selectedPermissions.includes(permissionId);
  };

  // useEffect(() => {
  //   if (mode === "update" && roleData?.data) {
  //     setRoleName(roleData.data.name);
  //     setDescription(roleData.data.description ?? "");
  //   }
  // }, [mode, roleData]);

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

      if (menu.menu_type !== "group") {
        const viewPermission = getPermission(menu, "viewAny");
        const createPermission = getPermission(menu, "create");
        const updatePermission = getPermission(menu, "update");
        const deletePermission = getPermission(menu, "delete");
        const exportPermission = getPermission(menu, "export");

        rows.push(
          <tr
            key={menu.id}
            className="border-b h-14"
          >
            <td className="px-6">
              <div
                className="flex items-center"
                style={{
                  paddingLeft: `${level * 24}px`,
                }}
              >
                {menu.label}
              </div>
            </td>

            {/* ALL ACCESS */}
            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={isAllAccessSelected(menu)}
                  onCheckedChange={() =>
                    toggleAllAccess(menu)
                  }
                />
              </div>
            </td>

            {/* VIEW */}
            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={
                    viewPermission
                      ? selectedPermissions.includes(viewPermission.id)
                      : false
                  }
                  disabled={!viewPermission}
                  onCheckedChange={() => {
                    if (viewPermission) {
                      togglePermission(viewPermission.id);
                    }
                  }}
                />
              </div>
            </td>

            {/* CREATE */}
            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={
                    createPermission
                      ? selectedPermissions.includes(createPermission.id)
                      : false
                  }
                  disabled={!createPermission}
                  onCheckedChange={() => {
                    if (createPermission) {
                      togglePermission(createPermission.id);
                    }
                  }}
                />
              </div>
            </td>

            {/* UPDATE */}
            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={
                    updatePermission
                      ? selectedPermissions.includes(updatePermission.id)
                      : false
                  }
                  disabled={!updatePermission}
                  onCheckedChange={() => {
                    if (updatePermission) {
                      togglePermission(updatePermission.id);
                    }
                  }}
                />
              </div>
            </td>

            {/* DELETE */}
            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={
                    deletePermission
                      ? selectedPermissions.includes(deletePermission.id)
                      : false
                  }
                  disabled={!deletePermission}
                  onCheckedChange={() => {
                    if (deletePermission) {
                      togglePermission(deletePermission.id);
                    }
                  }}
                />
              </div>
            </td>

            {/* EXPORT */}
            <td className="text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={
                    exportPermission
                      ? selectedPermissions.includes(exportPermission.id)
                      : false
                  }
                  disabled={!exportPermission}
                  onCheckedChange={() => {
                    if (exportPermission) {
                      togglePermission(exportPermission.id);
                    }
                  }}
                />
              </div>
            </td>
          </tr>
        );
      }

      rows.push(
        ...renderRows(
          menu.children ?? [],
          level + 1
        )
      );

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
                      <th className="text-center">Export</th>
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