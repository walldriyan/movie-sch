
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import React from 'react';

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  console.log('[SessionProvider] Received session prop on client:', JSON.stringify(session, null, 2));
  return <NextAuthSessionProvider session={session} refetchOnWindowFocus={true}>{children}</NextAuthSessionProvider>;
}
