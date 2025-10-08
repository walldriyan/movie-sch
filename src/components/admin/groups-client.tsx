
'use client';

import { useState, useTransition, useEffect } from 'react';
import type { Group, User, GroupMember } from '@prisma/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, RefreshCw, Users, ShieldQuestion, Loader2, AlertCircle, MoreHorizontal, Check, X, UserPlus, Trash2, Edit, View, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createGroup, getGroups, updateGroup, deleteGroup, getGroupDetails, updateGroupMembers, respondToGroupRequest } from '@/lib/actions/groupActions';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/permissions';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type GroupWithCount = Group & { _count: { members: number }, pendingMembersCount: number };
type DetailedGroupMember = GroupMember & { user: User };
type GroupWithDetails = Group & { members: DetailedGroupMember[] };


interface GroupsClientProps {
  initialGroups: GroupWithCount[];
  allUsers: User[];
}

const groupFormSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters.'),
  description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;


const ManageMembersDialog = ({ group, allUsers, onUpdate, isOpen, onOpenChange }: { group: GroupWithDetails, allUsers: User[], onUpdate: () => void, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const [selectedUsers, setSelectedUsers] = useState<string[]>(() => group.members.filter(m => m.role === 'MEMBER' || m.role === 'ADMIN').map(m => m.userId));
    const [isSaving, startSaving] = useTransition();
    const [isResponding, startResponding] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        if(isOpen) {
            setSelectedUsers(group.members.filter(m => m.role === 'MEMBER' || m.role === 'ADMIN').map(m => m.userId));
        }
    }, [isOpen, group.members]);

    const pendingRequests = group.members.filter(m => m.role === 'PENDING');
    
    const handleSave = () => {
      startSaving(async () => {
        try {
          await updateGroupMembers(group.id, selectedUsers);
          toast({ title: "Members Updated" });
          onUpdate();
          onOpenChange(false);
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
      });
    }

    const handleRequestResponse = (membershipId: number, approve: boolean) => {
        startResponding(async () => {
            try {
                await respondToGroupRequest(membershipId, approve);
                toast({ title: `Request ${approve ? 'Approved' : 'Declined'}`});
                onUpdate();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    }


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Members for &quot;{group.name}&quot;</DialogTitle>
                    <DialogDescription>Add or remove members and handle join requests.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                    <div>
                        <h4 className="font-semibold mb-4">Join Requests ({pendingRequests.length})</h4>
                        <ScrollArea className="h-48">
                            <div className="space-y-2 pr-4">
                                {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                    <div key={req.userId} className="flex items-center justify-between text-sm">
                                        <span>{req.user.name}</span>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={() => handleRequestResponse(req.id, true)} disabled={isResponding}><Check className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRequestResponse(req.id, false)} disabled={isResponding}><X className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground">No pending requests.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-4">Add/Remove Members</h4>
                        <Command className="rounded-lg border">
                          <CommandInput placeholder="Search users..." />
                          <CommandList>
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                               <ScrollArea className="h-40">
                                {allUsers.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    value={user.name || user.email || ''}
                                    onSelect={() => {
                                        if (selectedUsers.includes(user.id)) {
                                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                        } else {
                                            setSelectedUsers([...selectedUsers, user.id]);
                                        }
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', selectedUsers.includes(user.id) ? 'opacity-100' : 'opacity-0')} />
                                    <span>{user.name}</span>
                                </CommandItem>
                                ))}
                               </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const EditGroupDialog = ({ group, onGroupUpdate }: { group: Group, onGroupUpdate: () => void }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: group.name, description: group.description || '' },
  });

  const { formState: { isSubmitting }, handleSubmit, reset } = form;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset({ name: group.name, description: group.description || '' });
    setOpen(isOpen);
  }

  const onSubmit = async (values: GroupFormValues) => {
    try {
      await updateGroup(group.id, values);
      toast({ title: 'Group Updated' });
      onGroupUpdate();
      handleOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="mr-2 h-4 w-4" /> Edit Group
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group: {group.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupsClient({ initialGroups, allUsers }: GroupsClientProps) {
  const [groups, setGroups] = useState<GroupWithCount[]>(initialGroups);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isFormSubmitting, startFormSubmitTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [detailedGroup, setDetailedGroup] = useState<GroupWithDetails | null>(null);
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [debugError, setDebugError] = useState<any>(null);
  const currentUser = useCurrentUser();
  const { toast } = useToast();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: '', description: '' },
  });

  const fetchGroups = async () => {
    startRefreshTransition(async () => {
        try {
          const groupsFromDb = (await getGroups()) as GroupWithCount[];
          setGroups(groupsFromDb);

          if (detailedGroup) {
            const updatedDetails = (await getGroupDetails(detailedGroup.id)) as GroupWithDetails | null;
            if (updatedDetails) {
                setDetailedGroup(updatedDetails);
            }
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch groups.' });
        }
    });
  };
  
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const handleCreateGroup = async (values: GroupFormValues) => {
    startFormSubmitTransition(async () => {
        setFormError(null);
        setDebugError(null);
        try {
          await createGroup(values.name, values.description || null);
          toast({ title: 'Group Created', description: `Group "${values.name}" has been created.` });
          setCreateDialogOpen(false);
          form.reset();
          await fetchGroups();
        } catch (error: any) {
          setFormError(error.message || 'An unknown error occurred.');
          setDebugError(error);
        }
    });
  };
  
  const handleDeleteGroup = async (groupId: number) => {
    startActionTransition(async () => {
      setDebugError(null);
        try {
            await deleteGroup(groupId);
            toast({ title: 'Group Deleted' });
            fetchGroups();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            setDebugError(error);
        }
    });
  }
  
  const handleApproveGroup = (groupId: number) => {
    startActionTransition(async () => {
        setDebugError(null);
        try {
            await updateGroup(groupId, { isPublic: true });
            toast({ title: 'Group Approved'});
            fetchGroups();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error approving group', description: error.message });
            setDebugError(error);
        }
    });
  };

  const openManageMembersDialog = async (group: GroupWithCount) => {
    const details = (await getGroupDetails(group.id)) as GroupWithDetails | null;
    if(details) {
        setDetailedGroup(details);
        setManageMembersDialogOpen(true);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch group details.' });
    }
  }

  const canCreateGroup = currentUser && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(currentUser.role);


  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Manage Groups</h1>
        {canCreateGroup && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>Create a new user group. As a USER_ADMIN, your group will require approval.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl><Input placeholder="e.g., VIP Members" {...field} /></FormControl>
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
                      <FormControl><Textarea placeholder="What is this group for?" {...field} /></FormControl>
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
                  <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isFormSubmitting}>
                    {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Group
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Groups</CardTitle>
              <CardDescription>A list of all user groups in the system.</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => { fetchGroups(); toast({ title: 'Group list refreshed' }); }} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" /> {group._count.members}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => openManageMembersDialog(group)} className="flex items-center hover:bg-muted/50 rounded-md -m-2 p-2 transition-colors cursor-pointer disabled:cursor-not-allowed" disabled={isActionPending}>
                        <ShieldQuestion className="h-4 w-4 mr-2 text-muted-foreground" />
                        {group.pendingMembersCount > 0 ? (<Badge variant="destructive">{group.pendingMembersCount}</Badge>) : (<span>{group.pendingMembersCount}</span>)}
                      </button>
                    </TableCell>
                    <TableCell>
                        <Badge variant={group.isPublic ? "default" : "secondary"}>
                            {group.isPublic ? 'Published' : 'Pending'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" disabled={isActionPending}><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem asChild><Link href={`/groups/${group.id}`}><View className="mr-2 h-4 w-4" />View Group</Link></DropdownMenuItem>
                             <EditGroupDialog group={group} onGroupUpdate={fetchGroups} />
                            
                             <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openManageMembersDialog(group); }}>
                                <Users className="mr-2 h-4 w-4" /> Manage Members
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                             {currentUser?.role === ROLES.SUPER_ADMIN && !group.isPublic && (
                                <DropdownMenuItem onSelect={() => handleApproveGroup(group.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                            )}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />Delete Group
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the &quot;{group.name}&quot; group and all its member associations. This action cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteGroup(group.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No groups found. Create one to get started.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {detailedGroup && (
        <ManageMembersDialog 
            group={detailedGroup} 
            allUsers={allUsers} 
            onUpdate={fetchGroups} 
            isOpen={manageMembersDialogOpen}
            onOpenChange={setManageMembersDialogOpen}
        />
      )}
       {debugError && (
        <div className="mt-8 p-4 border border-dashed rounded-lg text-left bg-card">
            <h2 className="text-lg font-semibold mb-2 text-destructive">Debug Error Information</h2>
            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
              {JSON.stringify({
                  message: debugError.message,
                  stack: debugError.stack,
                  ...debugError
              }, null, 2)}
            </pre>
          </div>
      )}
    </>
  );
}
