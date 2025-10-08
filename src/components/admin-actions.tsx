
'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import AuthGuard from '@/components/auth/auth-guard';
import { MovieStatus, ROLES } from '@/lib/permissions';
import type { Post } from '@/lib/types';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { updatePostStatus } from '@/lib/actions/postActions';

interface AdminActionsProps {
  post: Post;
}

export default function AdminActions({ post }: AdminActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const authorAvatarUrl = post.author.image;
  const [selectedStatus, setSelectedStatus] = useState(post.status);
  const [isStatusChanging, startStatusTransition] = useTransition();


  const handleStatusChange = (newStatus: string) => {
    startStatusTransition(async () => {
      try {
        await updatePostStatus(post.id, newStatus);
        toast({
          title: "Status Updated",
          description: `Post status has been changed to ${newStatus}.`,
        });
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update post status.",
        });
      }
    });
  };
  
  const onConfirmStatusChange = () => {
    if (selectedStatus !== post.status) {
      handleStatusChange(selectedStatus);
    }
  };

  return (
    <AuthGuard requiredRole={ROLES.SUPER_ADMIN}>
      <section id="admin-actions">
        <Separator className="my-12" />
        <Card className="bg-card/50 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Admin Actions
            </CardTitle>
            <CardDescription>This section is only visible to Super Admins.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Change Status</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Update the visibility and status of this post.
              </p>
              <div className="flex items-center gap-2">
                <Select
                  defaultValue={post.status}
                  onValueChange={setSelectedStatus}
                  disabled={isStatusChanging}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MovieStatus).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                    onClick={onConfirmStatusChange}
                    disabled={isStatusChanging || selectedStatus === post.status}
                >
                    {isStatusChanging ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        'Update Status'
                    )}
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Author Details</h4>
              <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 group">
                <Avatar>
                  {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={post.author.name || 'Author'} />}
                  <AvatarFallback>{post.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium group-hover:text-primary">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground">{post.author.email}</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </AuthGuard>
  );
}
