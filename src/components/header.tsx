
import HeaderClient from './header-client';
import React from 'react';
import { auth } from '@/auth';

// This is a server-compatible component that receives the session and passes it to the client component.
export default async function Header() {
  // We fetch the session on the server to provide it to the client provider initially.
  const session = await auth();
  return <HeaderClient />;
}
