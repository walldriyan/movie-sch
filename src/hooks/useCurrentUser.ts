
"use client";

import { useSession } from "next-auth/react";

export const useCurrentUser = () => {
  const { data: session } = useSession();
  console.log('[useCurrentUser] hook session data:', session);
  console.log('[useCurrentUser] hook user data:', session?.user);
  return session?.user;
};
