
'use client';

// This file is no longer needed with the new NextAuth.js v5 architecture.
// The RootLayout now handles passing the session directly.
// This file can be deleted.

import React from 'react';

export default function Providers({
  children,
}: {
  children: React.ReactNode,
}) {
  return <>{children}</>;
}
