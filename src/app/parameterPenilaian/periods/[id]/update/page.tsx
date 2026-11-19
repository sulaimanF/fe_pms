import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { PeriodUpdatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return (
    <ParameterAccessGuard>
      <PeriodUpdatePage />
    </ParameterAccessGuard>
  );
}
