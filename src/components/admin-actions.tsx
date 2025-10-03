'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import AuthGuard from '@/components/auth/auth-guard';
import { MovieStatus, ROLES } from '@/lib/permissions';
import type { Movie } from '@/lib/types';
import { updateMovieStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface AdminActionsProps {
  movie: Movie;
}

export default function AdminActions({ movie }: AdminActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isStatusChanging, startStatusTransition] = useTransition();
  const authorAvatarUrl = movie.author.image;

  const handleStatusChange = (newStatus: string) => {
    startStatusTransition(async () => {
      try {
        await updateMovieStatus(movie.id, newStatus);
        toast({
          title: "Status Updated",
          description: `Movie status has been changed to ${newStatus}.`,
        });
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update movie status.",
        });
      }
    });
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
                Update the visibility and status of this movie post.
              </p>
              <div className="flex items-center gap-2">
                <Select
                  defaultValue={movie.status}
                  onValueChange={handleStatusChange}
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
                {isStatusChanging && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Author Details</h4>
              <Link href={`/profile/${movie.author.id}`} className="flex items-center gap-3 group">
                <Avatar>
                  {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={movie.author.name || 'Author'} />}
                  <AvatarFallback>{movie.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium group-hover:text-primary">{movie.author.name}</p>
                  <p className="text-sm text-muted-foreground">{movie.author.email}</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </AuthGuard>
  );
}
