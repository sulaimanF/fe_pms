"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PermissionRole from "@/components/role/PermissionRole";

export default function CreateRolePage() {
  const router = useRouter();

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const handleCancel = () => {
    router.push("/roleManagement");
  };

  const handleSave = () => {
    console.log("ROLE NAME:", roleName);
    console.log("DESCRIPTION:", description);
    console.log("SELECTED PERMISSIONS:", selectedPermissions);

    // API create role nanti di sini
  };

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
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}