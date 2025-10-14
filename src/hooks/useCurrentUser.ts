
"use client";

// This hook is deprecated in NextAuth v5 when not using the SessionProvider.
// Components should receive the session as a prop from a Server Component parent.
// However, we are keeping it for now and will adapt HeaderClient to not use it.
import { useSession } from "next-auth/react";

export const useCurrentUser = () => {
  const { data: session } = useSession();
  console.log('[useCurrentUser] hook session data:', session);
  return session?.user;
};
