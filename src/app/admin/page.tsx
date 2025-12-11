'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import type { User, Role, Group, Post } from '@prisma/client';
import { getUsers, updateUserRole, updateUserSubscription, getGroups, getGroupsForForm, getSetting, updateSetting, getPostsForAdmin, getExamsForAdmin } from '@/lib/actions';
import { Button } from '../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import {
    MoreHorizontal,
    PlusCircle,
    ShieldQuestion,
    RefreshCw,
    Check,
    X,
    Loader2,
    Settings as SettingsIcon,
    FileText,
    Users as UsersIcon,
    BookOpen,
    UsersRound,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuPortal
} from '../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { ROLES } from '../../lib/permissions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import GroupsClient from '@/components/admin/groups-client';
import ExamsClient from '@/components/admin/exams-client';
import AdsManager from '@/components/admin/ads-manager';
import { getAdsConfig } from '@/lib/actions/ads';

import type { GroupWithCount } from '@/lib/types';

// Settings Schema
const settingsSchema = z.object({
    dailyPostLimit: z.coerce.number().min(0, 'Limit must be 0 or more. 0 for unlimited.').default(10),
    microPostGroupIds: z.array(z.string()).optional(),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;
type PostWithGroup = Post & { group: { name: string } | null };

// Multi-select component for groups
function MultiSelectGroups({
    allGroups,
    selectedGroupIds,
    onSelectionChange,
}: {
    allGroups: Pick<Group, 'id' | 'name'>[];
    selectedGroupIds: string[];
    onSelectionChange: (ids: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const selectedGroups = useMemo(() => allGroups.filter(g => selectedGroupIds.includes(g.id)), [allGroups, selectedGroupIds]);

    const handleSelect = (groupId: string) => {
        onSelectionChange([...selectedGroupIds, groupId]);
        setOpen(false);
    };

    const handleUnselect = (groupId: string) => {
        onSelectionChange(selectedGroupIds.filter(id => id !== groupId));
    };

    const unselectedGroups = allGroups.filter(g => !selectedGroupIds.includes(g.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-10">
                <div className="flex flex-wrap gap-1">
                    {selectedGroups.map((group) => (
                        <Badge key={group.id} variant="secondary">
                            {group.name}
                            <button
                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onClick={() => handleUnselect(group.id)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
                    <PopoverTrigger asChild>
                        <div role="combobox" aria-expanded={open} aria-controls="group-list" className="flex-grow cursor-pointer">
                            <p className="text-sm text-muted-foreground">{selectedGroups.length === 0 && "Select groups..."}</p>
                        </div>
                    </PopoverTrigger>
                </div>
            </div>

            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search groups..." />
                    <CommandList id="group-list">
                        <CommandEmpty>No groups found.</CommandEmpty>
                        <CommandGroup>
                            {unselectedGroups.map((group) => (
                                <CommandItem
                                    key={group.id}
                                    onSelect={() => handleSelect(group.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedGroupIds.includes(group.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {group.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function ManageSubscriptionDialog({ user, isOpen, onClose, onUpdate }: { user: User, isOpen: boolean, onClose: () => void, onUpdate: () => void }) {
    const [accountType, setAccountType] = useState<'FREE' | 'PREMIUM' | 'HYBRID'>(user.accountType || 'FREE');
    const [date, setDate] = useState<Date | undefined>(user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : undefined);
    const [isSaving, startSaving] = useTransition();
    const { toast } = useToast();

    const handleSave = () => {
        startSaving(async () => {
            try {
                await updateUserSubscription(user.id, accountType, date ? date.toISOString() : null);
                toast({ title: 'Subscription Updated', description: `Subscription for ${user.name} has been updated.` });
                onUpdate();
                onClose();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update subscription.' });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-[#111112] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Manage Subscription</DialogTitle>
                    <DialogDescription>
                        Update subscription status and validity for {user.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account-type" className="text-right">
                            Type
                        </Label>
                        <Select value={accountType} onValueChange={(val: any) => setAccountType(val)}>
                            <SelectTrigger className="w-[280px] bg-white/5 border-white/10">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111112] border-white/10 text-white z-[100]">
                                <SelectItem value="FREE">Free</SelectItem>
                                <SelectItem value="PREMIUM">Premium</SelectItem>
                                <SelectItem value="HYBRID">Hybrid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expiry" className="text-right">
                            Expiry
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[280px] justify-start text-left font-normal bg-white/5 border-white/10 hover:bg-white/10 hover:text-white",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#111112] border-white/10 z-[100]" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    className="bg-[#111112] text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// Users Tab Component
function UsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isChangingStatus, startStatusChangeTransition] = useTransition();
    const [selectedUserForSub, setSelectedUserForSub] = useState<User | null>(null);


    const fetchUsers = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const usersFromDb = await getUsers();
            setUsers(usersFromDb);
        } catch {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch users.',
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRefreshAndToast = () => {
        fetchUsers();
        toast({ title: 'User list refreshed' });
    }

    const handleStatusChange = (user: User, newStatus: string) => {
        startStatusChangeTransition(async () => {
            try {
                await updateUserRole(user.id, user.role as Role, newStatus, user.dailyPostLimit?.toString() ?? null);
                toast({ title: 'Status Updated', description: `${user.name}'s status updated to ${newStatus}` });
                fetchUsers();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                toast({ variant: 'destructive', title: 'Update Failed', description: message });
            }
        });
    }

    const handleRoleChange = (user: User, newRole: Role) => {
        startStatusChangeTransition(async () => {
            try {
                await updateUserRole(user.id, newRole, user.permissionRequestStatus || 'NONE', user.dailyPostLimit?.toString() ?? null);
                toast({ title: 'Role Updated', description: `${user.name}'s role updated to ${newRole}` });
                fetchUsers();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                toast({ variant: 'destructive', title: 'Update Failed', description: message });
            }
        });
    };

    return (
        <div className="space-y-4">
            <Card className="bg-[#111112] border-white/5 shadow-2xl overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription className="mt-1">
                                View and manage user roles, permissions, and status.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefreshAndToast} disabled={isRefreshing} className="rounded-full bg-transparent border-white/10 hover:bg-white/10 text-white">
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="pl-6 h-12 text-white/50 font-medium">User</TableHead>
                                <TableHead className="h-12 text-white/50 font-medium">Email</TableHead>
                                <TableHead className="h-12 text-white/50 font-medium">Role</TableHead>
                                <TableHead className="h-12 text-white/50 font-medium">Subscription</TableHead>
                                <TableHead className="h-12 text-white/50 font-medium text-right pr-6">Actions</TableHead>

                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <TableCell className="font-medium max-w-xs pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9 border border-white/10">
                                                    <AvatarImage src={user.image || undefined} alt={user.name || 'U'} />
                                                    <AvatarFallback className="bg-white/10 text-xs">{user.name?.substr(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-white/90">{user.name}</span>
                                                        {user.permissionRequestStatus === 'PENDING' && (
                                                            <Badge variant="outline" className='border-yellow-500/50 text-yellow-500 bg-yellow-500/10 text-[10px] px-1.5 py-0 h-5'>
                                                                Request
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {user.permissionRequestMessage && (
                                                        <p className="text-[11px] text-muted-foreground italic truncate max-w-[150px]">
                                                            &quot;{user.permissionRequestMessage}&quot;
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    user.role === 'SUPER_ADMIN'
                                                        ? 'default'
                                                        : user.role === 'USER_ADMIN'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                                className={cn(
                                                    "capitalize",
                                                    user.role === 'SUPER_ADMIN' && "bg-primary text-primary-foreground hover:bg-primary/90",
                                                    user.role === 'USER_ADMIN' && "bg-white/10 text-white hover:bg-white/20",
                                                    user.role === 'USER' && "border-white/10 text-muted-foreground"
                                                )}
                                            >
                                                {user.role.replace('_', ' ').toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    variant={user.accountType === 'PREMIUM' ? 'default' : user.accountType === 'HYBRID' ? 'secondary' : 'outline'}
                                                    className={cn(
                                                        "w-fit",
                                                        user.accountType === 'PREMIUM' && "bg-gradient-to-r from-amber-500 to-orange-600 border-none text-white",
                                                        user.accountType === 'FREE' && "border-white/10 text-muted-foreground",
                                                    )}
                                                >
                                                    {user.accountType}
                                                </Badge>
                                                {user.subscriptionEndDate && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Exp: {format(new Date(user.subscriptionEndDate), 'MMM d, yyyy')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        aria-haspopup="true"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full hover:bg-white/10"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#111112] border-white/10 z-50">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent className="bg-[#111112] border-white/10">
                                                                <DropdownMenuRadioGroup
                                                                    value={user.role}
                                                                    onValueChange={(newRole) => handleRoleChange(user, newRole as Role)}
                                                                >
                                                                    {Object.values(ROLES).map(role => (
                                                                        <DropdownMenuRadioItem key={role} value={role}>{role}</DropdownMenuRadioItem>
                                                                    ))}
                                                                </DropdownMenuRadioGroup>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>Change Permission Status</DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent className="bg-[#111112] border-white/10">
                                                                <DropdownMenuRadioGroup
                                                                    value={user.permissionRequestStatus || 'NONE'}
                                                                    onValueChange={(newStatus) => handleStatusChange(user, newStatus)}
                                                                >
                                                                    <DropdownMenuRadioItem value="NONE">None</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="PENDING">Pending</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="APPROVED">Approved</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="REJECTED">Rejected</DropdownMenuRadioItem>
                                                                </DropdownMenuRadioGroup>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem onClick={() => setSelectedUserForSub(user)}>
                                                        Manage Subscription
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (

                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground border-white/5">
                                        {isRefreshing ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /> : 'No users found.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {
                selectedUserForSub && (
                    <ManageSubscriptionDialog
                        user={selectedUserForSub}
                        isOpen={!!selectedUserForSub}
                        onClose={() => setSelectedUserForSub(null)}
                        onUpdate={fetchUsers}
                    />
                )
            }
        </div >
    );
}

// Settings Tab Component
function SettingsTab() {
    const [isSubmitting, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [allGroups, setAllGroups] = useState<Pick<Group, 'id' | 'name'>[]>([]);
    const { toast } = useToast();

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            dailyPostLimit: 10,
            microPostGroupIds: [],
        },
    });

    useEffect(() => {
        async function fetchSettings() {
            try {
                const [dailyPostLimit, microPostGroupsSetting, groupsData] = await Promise.all([
                    getSetting('dailyPostLimit_default'),
                    getSetting('microPostAllowedGroupIds'),
                    getGroupsForForm()
                ]);

                if (dailyPostLimit) {
                    form.setValue('dailyPostLimit', Number(dailyPostLimit.value));
                }

                if (microPostGroupsSetting?.value) {
                    form.setValue('microPostGroupIds', microPostGroupsSetting.value.split(','));
                }

                setAllGroups(groupsData);
            } catch {
                toast({
                    variant: 'destructive',
                    title: 'Error fetching settings',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [form, toast]);


    const onSubmit = (data: SettingsFormValues) => {
        startTransition(async () => {
            try {
                await Promise.all([
                    updateSetting('dailyPostLimit_default', String(data.dailyPostLimit)),
                    updateSetting('microPostAllowedGroupIds', (data.microPostGroupIds || []).join(','))
                ]);

                toast({
                    title: 'Settings Updated',
                    description: 'Your changes have been saved successfully.',
                });
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Could not save settings.';
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: message,
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card className="bg-[#111112] border-white/5 shadow-md">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-primary" />
                                Content & Post Limits
                            </CardTitle>
                            <CardDescription>
                                Manage limits for content creation across the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-1/4" />
                                    <Skeleton className="h-10 w-1/2" />
                                </div>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="dailyPostLimit"
                                    render={({ field }) => (
                                        <FormItem className="max-w-sm">
                                            <FormLabel>Default Daily Post Limit</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="10" {...field} className="bg-white/5 border-white/10" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111112] border-white/5 shadow-md">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <UsersIcon className="h-5 w-5 text-primary" />
                                Micro Post Settings
                            </CardTitle>
                            <CardDescription>
                                Control which user groups can see the Micro Posts tab on the homepage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-1/4" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="microPostGroupIds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Allowed Groups</FormLabel>
                                            <FormControl>
                                                <MultiSelectGroups
                                                    allGroups={allGroups}
                                                    selectedGroupIds={field.value || []}
                                                    onSelectionChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormDescription>If no groups are selected, only Super Admins can see the tab.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting || isLoading}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Settings
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

// Groups Tab Wrapper
function GroupsTab() {
    const [groups, setGroups] = useState<GroupWithCount[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [groupsData, usersData] = await Promise.all([
                    getGroups(),
                    getUsers()
                ]);
                setGroups(groupsData);
                setAllUsers(usersData);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return <GroupsClient initialGroups={groups} allUsers={allUsers} />;
}

// Exams Tab Wrapper  
function ExamsTab() {
    const [posts, setPosts] = useState<PostWithGroup[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [exams, setExams] = useState<Awaited<ReturnType<typeof getExamsForAdmin>>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [{ posts: postsData }, groupsData, examsData] = await Promise.all([
                    getPostsForAdmin({ page: 1, limit: 10, userId: 'dummy-id', userRole: 'SUPER_ADMIN', sortBy: 'createdAt-desc' }),
                    getGroupsForForm(),
                    getExamsForAdmin()
                ]);
                setPosts(postsData as unknown as PostWithGroup[]);
                setGroups(groupsData as Group[]);
                setExams(examsData);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <ExamsClient
            initialPosts={posts}
            initialGroups={groups}
            initialExams={exams}
        />
    );
}

// Main Admin Dashboard
export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <ShieldQuestion className="h-8 w-8 text-primary" />
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground">Manage users, groups, content, and system configurations.</p>
            </div>

            <Tabs defaultValue="users" className="space-y-8">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full w-full max-w-2xl h-auto grid grid-cols-5 gap-1">
                    <TabsTrigger value="users" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 transition-all">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Users</span>
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 transition-all">
                        <UsersRound className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Groups</span>
                    </TabsTrigger>
                    <TabsTrigger value="exams" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 transition-all">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Exams</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 transition-all">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                    <TabsTrigger value="ads" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 transition-all">
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Ads</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="groups" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GroupsTab />
                </TabsContent>

                <TabsContent value="exams" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ExamsTab />
                </TabsContent>

                <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SettingsTab />
                </TabsContent>

                <TabsContent value="ads" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AdsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

import SponsoredAdsManager from '@/components/admin/sponsored-ads-manager';

// Ads Tab Wrapper
function AdsTab() {
    const [ads, setAds] = useState<Awaited<ReturnType<typeof getAdsConfig>>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAds() {
            try {
                const data = await getAdsConfig();
                setAds(data);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAds();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-10">
            <SponsoredAdsManager />

            <div className="pt-10 border-t border-white/5">
                <div className="mb-6">
                    <h3 className="text-xl font-bold">Site Ad Slots</h3>
                    <p className="text-muted-foreground text-sm">Configure static ad units for specific page locations.</p>
                </div>
                <AdsManager initialAds={ads} />
            </div>
        </div>
    );
}
