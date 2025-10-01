'use client';

import { signOut } from '@/auth';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useTransition } from 'react';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({ redirectTo: '/login' });
    });
  };
  
  return (
    <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
      <LogOut className="mr-2 h-4 w-4" />
      <span>{isPending ? 'Logging out...' : 'Log out'}</span>
    </DropdownMenuItem>
  );
}
