import ParameterAccessGuard from "@/components/parameter/ParameterAccessGuard";
import { SectionDetailPage } from "@/components/parameter/ParameterPages";

export default function Page() {
  return <ParameterAccessGuard><SectionDetailPage/></ParameterAccessGuard>;
}

