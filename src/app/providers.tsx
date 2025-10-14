
'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("Client [providers.tsx] Rendering SessionProvider on client.");
  return <SessionProvider>{children}</SessionProvider>;
}
