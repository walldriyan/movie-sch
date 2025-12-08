'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import type { User, Role, Group, Post } from '@prisma/client';
import { getUsers, updateUserRole, getGroups, getGroupsForForm, getSetting, updateSetting, getPostsForAdmin, getExamsForAdmin } from '@/lib/actions';
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
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/permissions';
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

// Users Tab Component
function UsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isChangingStatus, startStatusChangeTransition] = useTransition();

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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>
                                A list of all users in the system.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefreshAndToast} disabled={isRefreshing}>
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Post Limit</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium max-w-xs">
                                            <div className="flex items-center gap-2">
                                                <span>{user.name}</span>
                                                {user.permissionRequestStatus === 'PENDING' && (
                                                    <Badge variant="outline" className='border-yellow-500 text-yellow-500'>
                                                        <ShieldQuestion className="mr-1 h-3 w-3" />
                                                        Request
                                                    </Badge>
                                                )}
                                            </div>
                                            {user.permissionRequestMessage && (
                                                <p className="text-xs text-muted-foreground mt-1 italic truncate">
                                                    &quot;{user.permissionRequestMessage}&quot;
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    user.role === 'SUPER_ADMIN'
                                                        ? 'default'
                                                        : user.role === 'USER_ADMIN'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {user.dailyPostLimit === null ? 'Default' : user.dailyPostLimit}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        aria-haspopup="true"
                                                        size="icon"
                                                        variant="ghost"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
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
                                                            <DropdownMenuSubContent>
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
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive">
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        {isRefreshing ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 'No users found.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Content & Post Limits
                            </CardTitle>
                            <CardDescription>
                                Manage limits for content creation across the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                <Input type="number" placeholder="10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UsersIcon className="h-5 w-5" />
                                Micro Post Settings
                            </CardTitle>
                            <CardDescription>
                                Control which user groups can see the Micro Posts tab on the homepage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2">
                    <SettingsIcon className="h-6 w-6" />
                    Admin Dashboard
                </h1>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Users</span>
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4" />
                        <span className="hidden sm:inline">Groups</span>
                    </TabsTrigger>
                    <TabsTrigger value="exams" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Exams</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                    <TabsTrigger value="ads" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Ads</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="groups">
                    <GroupsTab />
                </TabsContent>

                <TabsContent value="exams">
                    <ExamsTab />
                </TabsContent>

                <TabsContent value="settings">
                    <SettingsTab />
                </TabsContent>

                <TabsContent value="ads">
                    <AdsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

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

    return <AdsManager initialAds={ads} />;
}
