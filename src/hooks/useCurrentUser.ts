
"use client";

import { useSession } from "next-auth/react";

export const useCurrentUser = () => {
  const { data: session } = useSession();
  console.log('[useCurrentUser] hook session data:', session);
  // SINHALA LOG as requested
  console.log('පරිශීලක දත්ත (Hook):', session?.user);
  return session?.user;
};
