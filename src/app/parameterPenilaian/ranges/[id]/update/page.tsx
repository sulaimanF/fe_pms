import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { RangeUpdatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return (
    <ParameterAccessGuard>
      <RangeUpdatePage />
    </ParameterAccessGuard>
  );
}
