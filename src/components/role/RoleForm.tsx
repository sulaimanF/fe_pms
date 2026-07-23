"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const tabs = [
  "Dashboard",
  "Audit Trail",
  "Kuesioner",
  "Response",
  "User Management",
  "Role Management",
  "Office Data",
];

const permissions = {
  Dashboard: ["Dashboard", "Statistik"],
  "Audit Trail": ["Audit Trail"],
  Kuesioner: ["Kuesioner"],
  Response: ["Response"],
  "User Management": ["User Management"],
  "Role Management": ["Role Management"],
  "Office Data": ["Office Data"],
};

export default function RoleForm() {
  
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              placeholder="Role Name"
            />
            <Input
              placeholder="Description Role"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-lg">
        <CardContent className="min-h-[550px] p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            defaultValue="overview"
          >
            <TabsList
              className="
                h-14
    w-full
    justify-start
    border-b
    border-gray-300
    rounded-none
    bg-transparent
    p-0
              "
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="
                    relative
    h-[64px]
    rounded-none
    border-b-[3px]
    border-transparent
    px-10
    text-sm
    font-medium
    text-gray-700
    shadow-none

    data-[state=active]:border-[#2563EB]
    data-[state=active]:text-[#2563EB]
    data-[state=active]:shadow-none
    data-[state=active]:bg-transparent
                    
                  "
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent
                key={tab}
                value={tab}
                className="m-0"
              >
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="h-12">
                      <th className="w-[15%] px-6 text-left font-medium">
                        Name
                      </th>

                      <th className="w-[10%] text-center font-medium">
                        All Access
                      </th>

                      <th className="w-[10%] text-center font-medium">
                        View
                      </th>

                      <th className="w-[10%] text-center font-medium">
                        Create
                      </th>

                      <th className="w-[10%] text-center font-medium">
                        Edit
                      </th>

                      <th className="w-[10%] text-center font-medium">
                        Delete
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {permissions[
                      tab as keyof typeof permissions
                    ].map((menu) => (
                      <tr
                        key={menu}
                        className="h-14 border-b last:border-none"
                      >
                        <td className="px-4 py-3">
                          {menu}
                        </td>

                        <td>
                          <div className="flex items-center justify-center">
                            <Checkbox />
                          </div>
                        </td>

                        <td>
                          <div className="flex items-center justify-center">
                            <Checkbox />
                          </div>
                        </td>

                        <td>
                          <div className="flex items-center justify-center">
                            <Checkbox />
                          </div>
                        </td>

                        <td>
                          <div className="flex items-center justify-center">
                            <Checkbox />
                          </div>
                        </td> 

                        <td>
                          <div className="flex items-center justify-center">
                            <Checkbox />
                          </div>
                        </td>
                      </tr>
                    ))}
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
        >
          Cancel
        </Button>

        <Button
          className="rounded-lg bg-blue-600 px-15 py-2 text-sm text-white hover:bg-blue-700"
        >
          Save
        </Button>
      </div>
    </div>
  );
}