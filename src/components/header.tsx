
import HeaderClient from './header-client';
import React from 'react';
import type { Session } from 'next-auth';

// This is a server-compatible component that receives the session and passes it to the client component.
export default function Header({ session }: { session: Session | null }) {
  // This component now just acts as a pass-through.
  // It gets the session from a parent Server Component (like layout.tsx) 
  // and passes it down to the Client Component.
  return <HeaderClient session={session} />;
}
