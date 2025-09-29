'use client';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Clapperboard, Users } from 'lucide-react';
import { Badge } from './ui/badge';

export default function RightSidebar() {
  const users = [
    { name: 'Alice', avatarId: 'avatar-1', activity: 'is watching Dune' },
    { name: 'Bob', avatarId: 'avatar-2', activity: 'liked Interstellar' },
    { name: 'Charlie', avatarId: 'avatar-3', activity: 'reviewed The Matrix' },
  ];

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users />
            <span className="font-semibold">Friend Activity</span>
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {users.map((user) => {
            const avatar = PlaceHolderImages.find((img) => img.id === user.avatarId);
            return (
              <SidebarMenuItem key={user.name}>
                <SidebarMenuButton
                  variant="ghost"
                  className="h-auto p-2 justify-start"
                >
                  <Avatar className="h-9 w-9">
                    {avatar && <AvatarImage src={avatar.imageUrl} alt={user.name} />}
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sidebar-foreground">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.activity}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Clapperboard />
            <span>Now Playing</span>
          </SidebarGroupLabel>
          <div className="mt-2 space-y-4">
             <div className="flex items-start gap-3">
                <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md">
                    <img src="https://images.unsplash.com/photo-1655006852875-7912caa28e8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzY2ktZmklMjBtb3ZpZXxlbnwwfHx8fDE3NTkwNzI3Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080" alt="Inception" className="h-full w-full object-cover" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-sidebar-foreground">Inception</h4>
                    <p className="text-xs text-muted-foreground">Sci-Fi, Action</p>
                    <Badge variant="outline" className="mt-2 text-xs">Watching</Badge>
                </div>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
