"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionRoleProps {
  selectedPermissions: number[];
  onChange: (permissions: number[]) => void;
}

export default function PermissionRole({
  selectedPermissions,
  onChange,
}: PermissionRoleProps) {

  const {
    data: permissionData,
    isLoading: permissionLoading,
  } = usePermissions();

  const permissions = (permissionData?.data ?? []).filter(
    (permission) => permission.is_active
  );

  const [activeTab, setActiveTab] = useState("");

  const permissionModules = [
    { key: "user", label: "User" },
    { key: "role", label: "Role" },
    { key: "outlet", label: "Outlet" },
    { key: "org-unit", label: "Organization Unit" },
    { key: "report", label: "Report" },
    { key: "audit", label: "Audit" },
    { key: "setting", label: "Setting" },
    { key: "api-key", label: "API Key" },
    { key: "permission-management", label: "Permission" },
    { key: "menu-management", label: "Menu" },
    { key: "assessment", label: "Questioner" },
  ];

  const getModulePermissions = (module: string) => {
    return permissions.filter(
      (permission) => permission.module === module
    );
  };

  const togglePermission = (permissionId: number) => {
    if (selectedPermissions.includes(permissionId)) {
      onChange(
        selectedPermissions.filter(
          (id) => id !== permissionId
        )
      );
    } else {
      onChange([
        ...selectedPermissions,
        permissionId,
      ]);
    }
  };

  const toggleAllAccess = (module: string) => {
    const modulePermissions = getModulePermissions(module);

    const permissionIds = modulePermissions.map(
      (permission) => Number(permission.id)
    );

    const allSelected =
      permissionIds.length > 0 &&
      permissionIds.every((id) =>
        selectedPermissions.includes(id)
      );

    if (allSelected) {
      onChange(
        selectedPermissions.filter(
          (id) => !permissionIds.includes(id)
        )
      );
    } else {
      onChange(
        Array.from(
          new Set([
            ...selectedPermissions,
            ...permissionIds,
          ])
        )
      );
    }
  };

  const isAllAccessSelected = (module: string) => {
    const modulePermissions =
      getModulePermissions(module);

    if (modulePermissions.length === 0) {
      return false;
    }

    return modulePermissions.every((permission) =>
      selectedPermissions.includes(
        Number(permission.id)
      )
    );
  };

  const isPermissionSelected = (
    permissionId: number
  ) => {
    return selectedPermissions.includes(permissionId);
  };

  useEffect(() => {
    if (
      !activeTab &&
      permissionModules.length > 0
    ) {
      setActiveTab(
        permissionModules[0].key
      );
    }
  }, [activeTab]);

  // renderPermissionRows dipindahkan ke sini
  const renderPermissionRows = (
    module: string
  ): React.ReactNode[] => {
    const modulePermissions = getModulePermissions(module);
    console.log("MODULE:", module);
    console.log("MODULE PERMISSIONS:", modulePermissions);

    const viewPermission = modulePermissions.find(
      (permission) => permission.action === "viewAny"
    );

    const createPermission = modulePermissions.find(
      (permission) => permission.action === "create"
    );

    const updatePermission = modulePermissions.find(
      (permission) => permission.action === "update"
    );

    const deletePermission = modulePermissions.find(
      (permission) => permission.action === "delete"
    );

    const exportPermission = modulePermissions.find(
      (permission) => permission.action === "export"
    );

    const reviewPermission = modulePermissions.find(
      (permission) => permission.action === "review"
    );

    const approvePermission = modulePermissions.find(
      (permission) => permission.action === "approve"
    );

    const rejectPermission = modulePermissions.find(
      (permission) => permission.action === "reject"
    );
    console.log("REVIEW:", reviewPermission);
    console.log("APPROVE:", approvePermission);
    console.log("REJECT:", rejectPermission);

    return [
      <tr key={module} className="border-b h-14">
        <td className="px-6">
          {permissionModules.find(
            (item) => item.key === module
          )?.label}
        </td>

        {/* ALL ACCESS */}
        <td className="text-center">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllAccessSelected(module)}
              onCheckedChange={() =>
                toggleAllAccess(module)
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
                  ? isPermissionSelected(
                      Number(viewPermission.id)
                    )
                  : false
              }
              disabled={!viewPermission}
              onCheckedChange={() => {
                if (viewPermission) {
                  togglePermission(
                    Number(viewPermission.id)
                  );
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
                  ? isPermissionSelected(
                      Number(createPermission.id)
                    )
                  : false
              }
              disabled={!createPermission}
              onCheckedChange={() => {
                if (createPermission) {
                  togglePermission(
                    Number(createPermission.id)
                  );
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
                  ? isPermissionSelected(
                      Number(updatePermission.id)
                    )
                  : false
              }
              disabled={!updatePermission}
              onCheckedChange={() => {
                if (updatePermission) {
                  togglePermission(
                    Number(updatePermission.id)
                  );
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
                  ? isPermissionSelected(
                      Number(deletePermission.id)
                    )
                  : false
              }
              disabled={!deletePermission}
              onCheckedChange={() => {
                if (deletePermission) {
                  togglePermission(
                    Number(deletePermission.id)
                  );
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
                  ? isPermissionSelected(
                      Number(exportPermission.id)
                    )
                  : false
              }
              disabled={!exportPermission}
              onCheckedChange={() => {
                if (exportPermission) {
                  togglePermission(
                    Number(exportPermission.id)
                  );
                }
              }}
            />
          </div>
        </td>

        {/* REVIEW */}
        <td className="text-center">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                reviewPermission
                  ? isPermissionSelected(
                      Number(reviewPermission.id)
                    )
                  : false
              }
              disabled={!reviewPermission}
              onCheckedChange={() => {
                if (reviewPermission) {
                  togglePermission(
                    Number(reviewPermission.id)
                  );
                }
              }}
            />
          </div>
        </td>

        {/* APPROVE */}
        <td className="text-center">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                approvePermission
                  ? isPermissionSelected(
                      Number(approvePermission.id)
                    )
                  : false
              }
              disabled={!approvePermission}
              onCheckedChange={() => {
                if (approvePermission) {
                  togglePermission(
                    Number(approvePermission.id)
                  );
                }
              }}
            />
          </div>
        </td>

        {/* REJECT */}
        <td className="text-center">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                rejectPermission
                  ? isPermissionSelected(
                      Number(rejectPermission.id)
                    )
                  : false
              }
              disabled={!rejectPermission}
              onCheckedChange={() => {
                if (rejectPermission) {
                  togglePermission(
                    Number(rejectPermission.id)
                  );
                }
              }}
            />
          </div>
        </td>
      </tr>,
    ];
  };

  return (
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
        {permissionModules.map((module) => (
          <TabsTrigger
            key={module.key}
            value={module.key}
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
            {module.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {permissionModules.map((module) => (
        <TabsContent
          key={module.key}
          value={module.key}
          className="m-0"
        >
          <table className="w-full">
            <thead>
              <tr className="h-12">
                <th className="w-[20%] text-left px-6">
                  Name
                </th>

                <th className="text-center">
                  All Access
                </th>

                <th className="text-center">
                  View
                </th>

                <th className="text-center">
                  Create
                </th>

                <th className="text-center">
                  Update
                </th>

                <th className="text-center">
                  Delete
                </th>

                <th className="text-center">
                  Export
                </th>

                <th className="text-center">
                  Review
                </th>

                <th className="text-center">
                  Approve
                </th>

                <th className="text-center">
                  Reject
                </th>
              </tr>
            </thead>

            <tbody>
              {renderPermissionRows(module.key)}
            </tbody>
          </table>
        </TabsContent>
      ))}
    </Tabs>
  );
}