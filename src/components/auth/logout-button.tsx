
'use client';

import { signOut } from 'next-auth/react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    try {
      // The callbackUrl will redirect the user after sign-out.
      // The SessionProvider will handle the state update.
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsPending(false);
    }
  };

  return (
    <DropdownMenuItem onClick={handleSignOut} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      <span>{isPending ? 'Logging out...' : 'Log out'}</span>
    </DropdownMenuItem>
  );
}
