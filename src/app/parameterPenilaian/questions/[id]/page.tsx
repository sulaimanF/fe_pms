import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { QuestionDetailPage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><QuestionDetailPage/></ParameterAccessGuard>;
}

