import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { SectionsPage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><SectionsPage/></ParameterAccessGuard>;
}

