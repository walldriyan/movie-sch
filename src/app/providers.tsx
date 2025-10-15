
'use client';

import React from 'react';
import SessionProvider from '@/components/auth/session-provider';
import type { Session } from 'next-auth';

// This component is now responsible for providing the client-side session.
export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  console.log("Client [providers.tsx] Rendering SessionProvider on client.");
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
