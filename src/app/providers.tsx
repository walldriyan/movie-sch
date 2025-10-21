
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

// This component is now responsible for providing the client-side session.
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
