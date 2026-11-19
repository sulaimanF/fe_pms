import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { ConfigurationUpdatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return (
    <ParameterAccessGuard>
      <ConfigurationUpdatePage />
    </ParameterAccessGuard>
  );
}
