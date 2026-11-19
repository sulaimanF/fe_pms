import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { QuestionCreatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><QuestionCreatePage/></ParameterAccessGuard>;
}

