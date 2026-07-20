"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight } from "lucide-react";
import OutletModal from "./outletModal";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUsers";
import { Controller, useForm } from "react-hook-form";
import { useRoles } from "@/hooks/useRoles";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnits";
import { useOutlets } from "@/hooks/useOutlets";
import { useWatch } from "react-hook-form";
import FormSkeleton from "@/components/skeletons/FormSkeleton"

type FormValues = {
  username: string;
  email: string;
  role: string;
  organizationUnit: string;
  status: string;
};

export default function UpdateUserPage() {

  const params = useParams();
  const id = Number(params.id);

  const {
    data,
    isLoading,
    isError,
  } = useUser(id);

  const user = data?.data;

  const [openModal, setOpenModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<number[]>([]);

  const { data: roleResponse } = useRoles();
  const roles = roleResponse?.data ?? [];

  const { data: organizationResponse } = useOrganizationUnits();
  const organizationUnits = organizationResponse?.data ?? [];

  const form = useForm<FormValues>({
    defaultValues: {
      username: "",
      email: "",
      role: "",
      organizationUnit: "",
      status: "",
    },
  });

  const organizationUnitId = useWatch({
    control: form.control,
    name: "organizationUnit",
  });

  // console.log("organizationUnits", organizationUnits);
  // console.log("form value", form.watch("organizationUnit"));

  const { data: outletResponse } = useOutlets(
    organizationUnitId
      ? Number(organizationUnitId)
      : undefined
  );

  const outlets = outletResponse?.data ?? [];

  useEffect(() => {
    if (!user) return;

    form.reset({
      username: user.username,
      email: user.email,
      role: String(user.roles[0]?.id ?? ""),
      organizationUnit: String(user.organization_unit.id),
      status: user.is_active ? "active" : "inactive",
    });
  }, [user, form]);

  useEffect(() => {
    if (!user) return;

    setSelectedOutlet(
      user.outlets?.map((outlet) => outlet.id) ?? []
    );
  }, [user]);

  const outletName = useMemo(() => {
    return outlets
      .filter((item) =>
        selectedOutlet.includes(item.id)
      )
      .map((item) => item.name)
      .join(", ");
  }, [outlets, selectedOutlet]);

  if (isLoading) {
    return <FormSkeleton />;
  }

  if (isError) {
    return (
      <div>Terjadi kesalahan.</div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Update User</h1>

      <div className="grid grid-cols-[180px_1fr] gap-x-8 gap-y-6">

        <label>Login ID</label>
        <Input
          className="w-full"
          {...form.register("username")}
        />

        <label>Email</label>
        <Input
          className="w-full"
          {...form.register("email")}
        />

        <label>Role</label>
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>

              <SelectContent>
                {roles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={String(role.id)}
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        <label>Kantor Wilayah</label>
        <Controller
          control={form.control}
          name="organizationUnit"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Kantor Wilayah" />
              </SelectTrigger>

              <SelectContent>
                {organizationUnits.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={String(item.id)}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        <label>Outlet Kelolaan</label>
        <div
          onClick={() => setOpenModal(true)}
          className="w-full border rounded-md h-10 flex items-center justify-between px-3 cursor-pointer"
        >
          <span className="truncate">{outletName}</span>
          <ArrowUpRight size={18} />
        </div>

        <label>Status</label>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="active">
                  Active
                </SelectItem>
                <SelectItem value="inactive">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />

      </div>

      <div className="flex justify-end">
        <Button className="rounded-lg bg-blue-600 px-8 py-2 text-sm text-white hover:bg-blue-700">
          Save
        </Button>
      </div>

      <OutletModal
        open={openModal}
        onOpenChange={setOpenModal}
        data={outlets}
        selected={selectedOutlet}
        setSelected={setSelectedOutlet}
      />
    </div>
  );
}