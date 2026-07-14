"use client";

import Link from "next/link";

export default function CreateOutletPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Create Data Outlet</h1>

      <div className="max-w-md">
        <div className="max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <div className="space-y-4">
            <select className="w-full rounded-lg border px-3 py-2">
              <option>Jenis</option>
            </select>

            <select className="w-full rounded-lg border px-3 py-2">
              <option>Nama</option>
            </select>

            <select className="w-full rounded-lg border px-3 py-2">
              <option>Provinsi</option>
            </select>

            <select className="w-full rounded-lg border px-3 py-2">
              <option>Kota</option>
            </select>

            <select className="w-full rounded-lg border px-3 py-2">
              <option>Kecamatan</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link
            href="/outletManagement"
            className="rounded-lg bg-gray-200 px-8 py-2 text-sm hover:bg-gray-300"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-8 py-2 text-sm text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}