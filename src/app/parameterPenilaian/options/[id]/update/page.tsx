import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { OptionUpdatePage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><OptionUpdatePage/></ParameterAccessGuard>;
}

