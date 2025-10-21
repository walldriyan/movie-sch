
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import React from 'react';

// This component is now responsible for providing the client-side session.
// No longer passing initial session from server to allow dynamic updates.
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
  session?: Session | null; // Make session optional
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
