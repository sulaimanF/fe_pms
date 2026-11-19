import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { SectionCreatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><SectionCreatePage/></ParameterAccessGuard>;
}

