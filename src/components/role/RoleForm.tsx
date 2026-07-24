"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useMenuTree } from "@/hooks/useMenu";
import { usePermissions } from "@/hooks/usePermissions";

export default function RoleForm() {
  
  const { data: menuData, isLoading: menuLoading } = useMenuTree();

  const { data: permissionData, isLoading: permissionLoading } = usePermissions();

  const menus = menuData?.data ?? [];

  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (!activeTab && menus.length > 0) {
      setActiveTab(menus[0].code);
    }
  }, [menus, activeTab]);

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              className="h-14 rounded-xl"
              placeholder="Role Name"
            />
            <Input
              className="h-14 rounded-xl"
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
                      <th className="w-[20%] text-left px-6">Menu</th>
                      <th className="text-center">All Access</th>
                      <th className="text-center">View</th>
                      <th className="text-center">Create</th>
                      <th className="text-center">Update</th>
                      <th className="text-center">Delete</th>
                    </tr>
                  </thead>

                  <tbody>

                    {menu.children.length > 0 ? (
                      menu.children.map((child) => (
                        <tr key={child.id} className="border-b h-14">
                          <td className="px-6">{child.label}</td>

                          <td className="text-center">
                            <Checkbox />
                          </td>

                          <td className="text-center">
                            <Checkbox />
                          </td>

                          <td className="text-center">
                            <Checkbox />
                          </td>

                          <td className="text-center">
                            <Checkbox />
                          </td>

                          <td className="text-center">
                            <Checkbox />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td>{menu.label}</td>

                        <td className="text-center">
                          <Checkbox />
                        </td>

                        <td className="text-center">
                          <Checkbox />
                        </td>

                        <td className="text-center">
                          <Checkbox />
                        </td>

                        <td className="text-center">
                          <Checkbox />
                        </td>

                        <td className="text-center">
                          <Checkbox />
                        </td>
                      </tr>
                    )}

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