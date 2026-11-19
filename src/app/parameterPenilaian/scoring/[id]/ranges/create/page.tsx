import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { RangeCreatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><RangeCreatePage/></ParameterAccessGuard>;
}

