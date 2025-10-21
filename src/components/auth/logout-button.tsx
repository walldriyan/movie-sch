
'use client';

import { useState } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    try {
      // Use client-side signOut. It handles the session update automatically.
      // The callbackUrl will redirect the user after sign-out.
      // The SessionProvider will handle the state update.
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsPending(false);
      // Optionally, show a toast notification on error
    }
    // No need to set isPending to false on success as the page will redirect.
  };

  return (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleSignOut} disabled={isPending}>
      <button disabled={isPending} className="flex w-full items-center">
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="mr-2 h-4 w-4" />
        )}
        <span>{isPending ? 'Logging out...' : 'Log out'}</span>
      </button>
    </DropdownMenuItem>
  );
}
