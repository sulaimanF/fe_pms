"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import PermissionRole from "@/components/role/PermissionRole";
import { useRole } from "@/hooks/useRoles";

export default function UpdateRolePage() {
  const router = useRouter();
  const params = useParams();

  const roleId = Number(params.id);

  const {
    data: roleData,
    isLoading: roleLoading,
  } = useRole(roleId);

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] =
    useState<number[]>([]);

  useEffect(() => {
    if (roleData?.data) {
      setRoleName(roleData.data.name ?? "");
      setDescription(roleData.data.description ?? "");

      setSelectedPermissions(
        (roleData.data.permissions ?? []).map(
          (permission) => Number(permission.id)
        )
      );
    }
  }, [roleData]);

  const handleCancel = () => {
    router.push("/roleManagement");
  };

  const handleUpdate = () => {
    console.log("ROLE ID:", roleId);
    console.log("ROLE NAME:", roleName);
    console.log("DESCRIPTION:", description);
    console.log(
      "SELECTED PERMISSIONS:",
      selectedPermissions
    );

    // API update role nanti di sini
  };

  if (roleLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Role Information */}
      <Card className="rounded-3xl shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              className="h-14 rounded-xl"
              placeholder="Role Name"
              value={roleName}
              onChange={(e) =>
                setRoleName(e.target.value)
              }
            />

            <Input
              className="h-14 rounded-xl"
              placeholder="Description Role"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Permission */}
      <Card className="rounded-3xl shadow-lg">
        <CardContent className="min-h-[550px] p-0">
          <PermissionRole
            selectedPermissions={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          className="rounded-lg border border-gray-300 px-15 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={handleCancel}
        >
          Cancel
        </Button>

        <Button
          className="rounded-lg bg-blue-600 px-15 py-2 text-sm text-white hover:bg-blue-700"
          onClick={handleUpdate}
        >
          Update
        </Button>
      </div>
    </div>
  );
}