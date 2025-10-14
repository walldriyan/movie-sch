
import HeaderClient from './header-client';
import React from 'react';
import type { Session } from 'next-auth';

// This is a server-compatible component that receives the session and passes it to the client component.
export default function Header({ session }: { session: Session | null }) {
  return <HeaderClient session={session} />;
}
