'use client';

import { doSignOut } from '@/lib/actions';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export default function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <form action={doSignOut}>
      <DropdownMenuItem asChild>
        <button type="submit" className="w-full" disabled={pending}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{pending ? 'Logging out...' : 'Log out'}</span>
        </button>
      </DropdownMenuItem>
    </form>
  );
}
