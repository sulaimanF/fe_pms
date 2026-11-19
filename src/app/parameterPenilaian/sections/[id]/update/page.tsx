import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { SectionUpdatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return (
    <ParameterAccessGuard>
      <SectionUpdatePage />
    </ParameterAccessGuard>
  );
}
