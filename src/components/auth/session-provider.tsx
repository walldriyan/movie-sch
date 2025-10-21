'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import React from 'react';

// This component is now responsible for providing the client-side session.
// It will automatically fetch the session, so no initial session needs to be passed.
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
