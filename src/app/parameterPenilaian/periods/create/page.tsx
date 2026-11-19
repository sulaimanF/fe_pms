import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { PeriodCreatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return (
    <ParameterAccessGuard>
      <PeriodCreatePage />
    </ParameterAccessGuard>
  );
}
