'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { doSignOut } from '@/lib/actions';

interface LogoutButtonProps {
  onClick?: () => void;
}

export default function LogoutButton({ onClick }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    if (onClick) {
      onClick(); // Optimistic UI update
    }
    startTransition(() => {
      doSignOut();
    });
  };

  return (
    <DropdownMenuItem asChild>
      <button onClick={handleLogout} className="w-full" disabled={isPending}>
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
