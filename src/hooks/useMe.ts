import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/auth.services";
import { useSessionQuery } from "@/hooks/useAuth";
import { sessionQueryKey } from "@/lib/queryClient";
import { requestInSession } from "@/lib/session";

export const useMe = () => {
  const session = useSessionQuery();
  return useQuery({
    ...session,
    queryKey: sessionQueryKey(session.id, "me"),
    queryFn: () => requestInSession(session.id, getMe),
  });
};
