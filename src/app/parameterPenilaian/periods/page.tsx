import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { PeriodsPage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><PeriodsPage/></ParameterAccessGuard>;
}

