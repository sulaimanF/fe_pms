import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { MethodsPage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><MethodsPage/></ParameterAccessGuard>;
}

