

'use server';

import { auth } from '@/auth';
import HeaderClient from './header-client';
import { ROLES } from '@/lib/permissions';
import { Button } from './ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { headers } from 'next/headers';

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  // Reading headers to ensure this component is treated as a dynamic server component
  const headersList = headers();

  const renderCreateButton = () => {
    if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
      return null;
    }

    return (
      <Button asChild variant="outline">
        <Link href="/manage?create=true">
          <PlusCircle className="mr-2 h-5 w-5" />
          <span>Create</span>
        </Link>
      </Button>
    );
  };

  return (
    <HeaderClient session={session} createButton={renderCreateButton()} />
  );
}
