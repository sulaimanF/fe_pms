import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { MethodDetailPage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><MethodDetailPage/></ParameterAccessGuard>;
}

