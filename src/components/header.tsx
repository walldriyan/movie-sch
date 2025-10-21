
import HeaderClient from './header-client';
import React from 'react';

// This is a server-compatible component that renders the client component.
// It no longer fetches the session on the server.
export default async function Header() {
  return <HeaderClient />;
}
