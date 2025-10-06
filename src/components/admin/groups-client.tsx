
'use client';

import { useState, useTransition } from 'react';
import type { Group, User } from '@prisma/client';
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
import { PlusCircle, RefreshCw, Users, MoreHorizontal, Loader2, AlertCircle, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createGroup, getGroups, getGroupDetails, updateGroupMembers } from '@/lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

type GroupWithCount = Group & { _count: { members: number } };
type GroupWithMembers = Group & { members: { user: User, role: string }[] };

interface GroupsClientProps {
  initialGroups: GroupWithCount[];
  allUsers: User[];
}

const groupFormSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters.'),
  description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;


function MultiSelectUsers({
  allUsers,
  selectedUsers,
  onSelectionChange,
}: {
  allUsers: User[];
  selectedUsers: User[];
  onSelectionChange: (users: User[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (user: User) => {
    onSelectionChange([...selectedUsers, user]);
    setOpen(false);
  };
  
  const handleUnselect = (user: User) => {
    onSelectionChange(selectedUsers.filter((u) => u.id !== user.id));
  };
  
  const unselectedUsers = allUsers.filter(
    (user) => !selectedUsers.some((selected) => selected.id === user.id)
  );

  return (
     <Popover open={open} onOpenChange={setOpen}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Members</p>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
          >
            <div className="flex flex-wrap gap-2">
              {selectedUsers.length > 0 ? (
                selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(user);
                    }}
                  >
                    {user.name}
                    <span className="ml-1 hover:text-destructive">×</span>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Select users...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandEmpty>No user found.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {unselectedUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUsers.some((u) => u.id === user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.name} ({user.email})
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


function ManageMembersDialog({ group, allUsers, onUpdate }: { group: GroupWithCount; allUsers: User[]; onUpdate: () => void; }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const { toast } = useToast();
    
    const [isFetchingDetails, startFetchingDetails] = useTransition();

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            startFetchingDetails(async () => {
                const groupDetails = await getGroupDetails(group.id) as GroupWithMembers | null;
                if (groupDetails) {
                    setSelectedUsers(groupDetails.members.map(m => m.user));
                }
            });
        }
        setOpen(isOpen);
    };
    
    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await updateGroupMembers(group.id, selectedUsers.map(u => u.id));
            toast({ title: 'Members updated', description: `Members for "${group.name}" have been saved.` });
            onUpdate();
            setOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update members.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Manage</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Members for &quot;{group.name}&quot;</DialogTitle>
                    <DialogDescription>
                        Add or remove users from this group.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isFetchingDetails ? (
                        <div className="space-y-2">
                             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                             <p className="text-center text-sm text-muted-foreground">Loading members...</p>
                        </div>
                    ) : (
                        <MultiSelectUsers
                            allUsers={allUsers}
                            selectedUsers={selectedUsers}
                            onSelectionChange={setSelectedUsers}
                        />
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSubmitting || isFetchingDetails}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function GroupsClient({ initialGroups, allUsers }: GroupsClientProps) {
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
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">{group.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {group._count.members}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
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
