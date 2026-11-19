import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { MethodCreatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><MethodCreatePage/></ParameterAccessGuard>;
}

