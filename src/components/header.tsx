

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
  // const headersList = headers();

  const renderCreateButton = () => {
    if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
      <div>no user found </div>
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
    <div className="flex flex-col gap-4 border-b border-gray-200 bg-white">
      {/* Header client part */}
      <HeaderClient session={session} createButton={renderCreateButton()} />

      {/* --- 👇 User Info List එක --- */}
      {user ? (
        <div className="mt-4 p-3 rounded-xl bg-gray-50 border">
          <h2 className="font-semibold text-lg mb-2">User Information</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            <li><strong>Name:</strong> {user.name}</li>
            <li><strong>Email:</strong> {user.email}</li>
            <li><strong>Role:</strong> {user.role}</li>
            {user.image && (
              <li className="flex items-center gap-2">
                <strong>Image:</strong>
                <img
                  src={user.image}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border"
                />
              </li>
            )}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 italic">No user logged in</p>
      )}
    </div>
  );
}
  // return (
  //   <HeaderClient session={session} createButton={renderCreateButton()} />
  // );

