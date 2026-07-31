import RoleForm from "@/components/role/RoleForm";

type Props = {
    params: Promise<{
    id: string;
  }>;
};

export default async function UpdateRolePage({ params }: Props) {
  const { id } = await params;

  return (
    <RoleForm
      mode="update"
      roleId={Number(id)}
    />
  );
}