'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApprovalRefreshButton() {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const { toast } = useToast();

  const handleRefresh = () => {
    startRefreshTransition(() => {
      router.refresh();
      toast({
        title: 'Refreshed',
        description: 'Approval list has been updated.',
      });
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  );
}
