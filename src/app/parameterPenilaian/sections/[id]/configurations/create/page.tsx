import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { ConfigurationCreatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><ConfigurationCreatePage/></ParameterAccessGuard>;
}

