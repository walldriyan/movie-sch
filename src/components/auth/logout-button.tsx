
'use client';

import { useFormStatus } from 'react-dom';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut, Loader2 } from 'lucide-react';
import { doSignOut } from '@/lib/actions';

function LogoutFormContent() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="flex w-full items-center">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      <span>{pending ? 'Logging out...' : 'Log out'}</span>
    </button>
  );
}

export default function LogoutButton() {
  return (
    <DropdownMenuItem className="p-0">
       <form action={doSignOut} className="w-full px-2 py-1.5">
        <LogoutFormContent />
      </form>
    </DropdownMenuItem>
  );
}
