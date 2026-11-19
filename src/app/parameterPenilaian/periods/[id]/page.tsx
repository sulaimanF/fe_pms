import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { PeriodDetailPage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><PeriodDetailPage/></ParameterAccessGuard>;
}

