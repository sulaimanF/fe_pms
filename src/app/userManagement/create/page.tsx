"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight } from "lucide-react";
import { outletData } from "./data";
import OutletModal from "./outletModal";

export default function CreateUserPage() {

  const [openModal, setOpenModal] = useState(false);

  const [selectedOutlet, setSelectedOutlet] = useState<number[]>([
    1,
    2,
    5,
  ]);

  const outletName = useMemo(() => {
    return outletData
      .filter((item) => selectedOutlet.includes(item.id))
      .map((item) => item.nama)
      .join(", ");
  }, [selectedOutlet]);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Edit User</h1>

      <div className="grid grid-cols-[180px_1fr] gap-x-8 gap-y-6">

        <label>Login ID</label>
        <Input defaultValue="Rafly21032" className="w-full"/>

        <label>Email</label>
        <Input defaultValue="rafly.rivaldi@btn.co.id" className="w-full" />

        <label>Role</label>
        <Select defaultValue="SAS">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SAS">SAS</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <label>Kantor Wilayah</label>
        <Select defaultValue="1">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Kantor Wilayah 1</SelectItem>
            <SelectItem value="2">Kantor Wilayah 2</SelectItem>
          </SelectContent>
        </Select>

        <label>Outlet Kelolaan</label>
        <div
          onClick={() => setOpenModal(true)}
          className="w-full border rounded-md h-10 flex items-center justify-between px-3 cursor-pointer"
        >
          <span className="truncate">{outletName}</span>
          <ArrowUpRight size={18} />
        </div>

        <label>Status</label>
        <Select defaultValue="active">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

      </div>

      <div className="flex justify-end">
        <Button className="rounded-lg bg-blue-600 px-8 py-2 text-sm text-white hover:bg-blue-700">
          Save
        </Button>
      </div>

      <OutletModal
        open={openModal}
        onOpenChange={setOpenModal}
        data={outletData}
        selected={selectedOutlet}
        setSelected={setSelectedOutlet}
      />
    </div>
  );
}