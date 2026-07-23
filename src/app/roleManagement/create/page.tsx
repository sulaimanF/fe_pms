import RoleForm from "@/components/role/RoleForm";

export default function CreateRolePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Create Role
      </h1>

      <RoleForm />
    </div>
  );
}