
import HeaderClient from './header-client';
import React from 'react';

// This is a server-compatible component that receives the session and passes it to the client component.
export default function Header() {
  // This component now just acts as a pass-through.
  // It no longer needs to fetch the session itself. The client component will handle it.
  return <HeaderClient />;
}
