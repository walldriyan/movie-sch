
import HeaderClient from './header-client';
import React from 'react';

// This is now a simple server-compatible component that just renders the client component.
// All client-side logic is now inside HeaderClient.
export default function Header() {
  return <HeaderClient />;
}
