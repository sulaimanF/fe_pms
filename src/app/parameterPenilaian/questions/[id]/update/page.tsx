import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { QuestionUpdatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return (
    <ParameterAccessGuard>
      <QuestionUpdatePage />
    </ParameterAccessGuard>
  );
}
