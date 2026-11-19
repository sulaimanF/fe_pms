import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { MethodUpdatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><MethodUpdatePage/></ParameterAccessGuard>;
}

