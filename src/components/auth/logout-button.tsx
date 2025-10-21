
'use client';

import { useFormStatus } from 'react-dom';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut, Loader2 } from 'lucide-react';
import { doSignOut } from '@/lib/actions';

export default function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={pending}>
       <form action={doSignOut} className="w-full">
         <button type="submit" disabled={pending} className="flex w-full items-center">
            {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
            <LogOut className="mr-2 h-4 w-4" />
            )}
            <span>{pending ? 'Logging out...' : 'Log out'}</span>
        </button>
      </form>
    </DropdownMenuItem>
  );
}
