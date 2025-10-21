
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

// This component is now responsible for providing the client-side session.
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  // SessionProvider without a session prop will automatically fetch the session
  // on the client side and keep it in sync.
  return <SessionProvider>{children}</SessionProvider>;
}
