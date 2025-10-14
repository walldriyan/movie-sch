
'use client';

import React from 'react';

// This component is now a simple pass-through.
// The actual SessionProvider logic is handled in `src/components/auth/session-provider.tsx`
// which is used in the root layout.
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("Client [providers.tsx] Rendering (pass-through).");
  return <>{children}</>;
}
