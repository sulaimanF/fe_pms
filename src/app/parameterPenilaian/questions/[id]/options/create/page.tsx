import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { OptionCreatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return (
    <ParameterAccessGuard>
      <OptionCreatePage />
    </ParameterAccessGuard>
  );
}
