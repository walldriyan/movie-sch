
'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import React from 'react';

export default function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode,
  session: Session | null
}) {
  console.log('[Providers.tsx] Received session prop on client:', JSON.stringify(session, null, 2));
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
