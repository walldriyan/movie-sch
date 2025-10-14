
'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// This component no longer needs to accept a session prop.
// The SessionProvider from next-auth/react will automatically
// fetch the session on the client side.
export default function Providers({ 
  children,
}: { 
  children: React.ReactNode,
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
