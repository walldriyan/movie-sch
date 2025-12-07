

'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import type { Group, User, Role as MemberRole, GroupMember } from '@prisma/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, RefreshCw, Users, MoreHorizontal, Loader2, AlertCircle, ChevronsUpDown, Check, Trash2, Mail, CheckCircle2, XCircle, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createGroup, getGroups, getGroupDetails, updateGroupMembers, getPendingGroupRequests, manageGroupJoinRequest } from '@/lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { GroupWithCount, GroupWithMembers, MemberWithUser } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link';
import EditGroupDialog from './edit-group-dialog';


const groupFormSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters.'),
  description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;


function MultiSelectUsers({
  allUsers,
  selectedMembers,
  onSelectionChange,
  onRoleChange,
}: {
  allUsers: User[];
  selectedMembers: MemberWithUser[];
  onSelectionChange: (users: MemberWithUser[]) => void;
  onRoleChange: (userId: string, role: MemberRole) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedUserIds = useMemo(() => selectedMembers.map(m => m.user.id), [selectedMembers]);

  const unselectedUsers = allUsers.filter(
    (user) => !selectedUserIds.includes(user.id)
  );

  const handleSelect = (user: User) => {
    onSelectionChange([...selectedMembers, { user, role: 'MEMBER', userId: user.id, groupId: '', status: 'ACTIVE', joinedAt: new Date(), id: crypto.randomUUID() }]);
    setOpen(false);
  };

  const handleUnselect = (userId: string) => {
    onSelectionChange(selectedMembers.filter((m) => m.user.id !== userId));
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="space-y-2">
        <div className="space-y-2">
          {selectedMembers.map((member) => (
            <div key={member.user.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.user.image || ''} />
                  <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={member.role} onValueChange={(value) => onRoleChange(member.user.id, value as MemberRole)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUnselect(member.user.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start mt-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add members...
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {unselectedUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.name} ({user.email})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


function ManageMembersDialog({ group, allUsers, onUpdate }: { group: GroupWithCount; allUsers: User[]; onUpdate: () => void; }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const [isFetchingDetails, startFetchingDetails] = useTransition();
  const [isManagingRequest, startManagingRequest] = useTransition();

  const [selectedMembers, setSelectedMembers] = useState<MemberWithUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<(GroupMember & { user: User })[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, MemberRole>>({});
  const { toast } = useToast();

  const fetchDetails = async () => {
    startFetchingDetails(async () => {
      const [groupDetails, pendingData] = await Promise.all([
        getGroupDetails(group.id) as Promise<GroupWithMembers | null>,
        getPendingGroupRequests(group.id)
      ]);

      if (groupDetails) {
        const initialMembers = groupDetails.members.map(m => ({ ...m, user: m.user! }));
        setSelectedMembers(initialMembers);
        const initialRoles: Record<string, MemberRole> = {};
        initialMembers.forEach(m => {
          initialRoles[m.user.id] = m.role as MemberRole;
        });
        setMemberRoles(initialRoles);
      }
      setPendingRequests(pendingData as any);
    });
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      fetchDetails();
    }
    setOpen(isOpen);
  };

  const handleRoleChange = (userId: string, role: MemberRole) => {
    setMemberRoles(prev => ({ ...prev, [userId]: role }));
    setSelectedMembers(prev => prev.map(m => m.user.id === userId ? { ...m, role } : m) as any);
  };

  const handleSave = async () => {
    startSubmitting(async () => {
      try {
        const memberIds = selectedMembers.map(m => m.user.id);
        await updateGroupMembers(group.id, memberIds, memberRoles as any);
        toast({ title: 'Members updated', description: `Members for "${group.name}" have been saved.` });
        onUpdate();
        await fetchDetails(); // refetch to be safe
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update members.' });
      }
    });
  };

  const handleRequestAction = (userId: string, action: 'APPROVE' | 'REJECT') => {
    startManagingRequest(async () => {
      try {
        await manageGroupJoinRequest(group.id, userId, action);
        toast({ title: `Request ${action.toLowerCase()}ed`, description: `The join request has been ${action.toLowerCase()}ed.` });
        await fetchDetails(); // Refresh list
        onUpdate();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to process request.' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="relative">
          <Button variant="outline" size="sm">Manage</Button>
          {(group._count?.pendingRequests ?? 0) > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{group._count?.pendingRequests}</Badge>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Members for &quot;{group.name}&quot;</DialogTitle>
          <DialogDescription>
            Add, remove, or change roles for users in this group.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Members ({selectedMembers.length})</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests
              {pendingRequests.length > 0 && !isFetchingDetails && (
                <Badge variant="destructive" className="absolute top-0 -right-1 h-5 w-5 justify-center p-0">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
            {isFetchingDetails ? (
              <div className="space-y-4 flex flex-col items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">Loading details...</p>
              </div>
            ) : (
              <>
                <TabsContent value="members" className="mt-0">
                  <MultiSelectUsers
                    allUsers={allUsers}
                    selectedMembers={selectedMembers}
                    onSelectionChange={setSelectedMembers}
                    onRoleChange={handleRoleChange}
                  />
                  <DialogFooter className="mt-6">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </TabsContent>
                <TabsContent value="requests" className="mt-0">
                  <div className="space-y-2">
                    {pendingRequests.length > 0 ? pendingRequests.map(req => (
                      <div key={req.userId} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={req.user.image || ''} />
                            <AvatarFallback>{req.user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{req.user.name}</p>
                            <p className="text-xs text-muted-foreground">{req.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleRequestAction(req.userId, 'REJECT')} disabled={isManagingRequest}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleRequestAction(req.userId, 'APPROVE')} disabled={isManagingRequest}>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Pending Requests</h3>
                        <p className="text-muted-foreground mt-2 text-sm">There are no pending join requests for this group.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


export default function GroupsClient({ initialGroups, allUsers }: { initialGroups: GroupWithCount[], allUsers: User[] }) {
  const [groups, setGroups] = useState<GroupWithCount[]>(initialGroups);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { toast } = useToast();
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const fetchGroups = async () => {
    setIsRefreshing(true);
    try {
      const groupsFromDb = (await getGroups()) as GroupWithCount[];
      setGroups(groupsFromDb);
      toast({ title: 'Group list refreshed' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch groups.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateGroup = async (values: GroupFormValues) => {
    setIsFormSubmitting(true);
    setFormError(null);
    try {
      await createGroup(values.name, values.description || null);
      toast({
        title: 'Group Created',
        description: `Group "${values.name}" has been created.`,
      });
      setCreateDialogOpen(false);
      form.reset();
      await fetchGroups();
    } catch (error: any) {
      setFormError(error.message || 'An unknown error occurred.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Manage Groups</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new user group to manage content access.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., VIP Members" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What is this group for?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isFormSubmitting}>
                    {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Group
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Groups</CardTitle>
              <CardDescription>
                A list of all user groups in the system.
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchGroups} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <Link href={`/groups/${group.id}`} className="hover:underline text-primary">
                        {group.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{group.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {group._count.members}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <EditGroupDialog group={group as any} />
                      <ManageMembersDialog group={group} allUsers={allUsers} onUpdate={fetchGroups} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No groups found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}