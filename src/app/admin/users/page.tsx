

'use client';

import { useState, useEffect, useTransition } from 'react';
import type { User } from '@prisma/client';
import { getUsers, updateUserRole } from '@/lib/actions';
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
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  PlusCircle,
  ShieldQuestion,
  RefreshCw,
  Check,
  X,
  Edit,
  Loader2
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
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/permissions';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const userEditSchema = z.object({
  role: z.nativeEnum(ROLES),
  permissionRequestStatus: z.enum(['NONE', 'PENDING', 'APPROVED', 'REJECTED']),
  dailyPostLimit: z.string().optional(),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;


function EditUserDialog({ user, onUserUpdate }: { user: User; onUserUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  console.log("Edit Dialog for User:", user);
  const availableRoles = Object.values(ROLES);
  console.log("Roles list:", availableRoles);


  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      role: user.role as keyof typeof ROLES,
      permissionRequestStatus: (user.permissionRequestStatus as 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED') || 'NONE',
      dailyPostLimit: user.dailyPostLimit?.toString() || '',
    },
  });
  
  // Reset form values when the dialog is opened with a new user
  useEffect(() => {
    if (isOpen) {
      form.reset({
        role: user.role as keyof typeof ROLES,
        permissionRequestStatus: (user.permissionRequestStatus as 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED') || 'NONE',
        dailyPostLimit: user.dailyPostLimit?.toString() || '',
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = (data: UserEditFormValues) => {
    console.log("Submitting form data:", data);
    startTransition(async () => {
      try {
        const limit = data.dailyPostLimit === '' || data.dailyPostLimit === undefined ? null : data.dailyPostLimit;
        await updateUserRole(user.id, data.role, data.permissionRequestStatus, limit);
        toast({ title: 'User Updated', description: `${user.name}'s details have been saved.` });
        onUserUpdate();
        setIsOpen(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
          <DialogDescription>
            Modify user role, status, and set content limits.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {Object.values(ROLES).map((role) => (
                        <FormItem key={role} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={role} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {role}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permissionRequestStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission Status</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="dailyPostLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Post Limit</FormLabel>
                   <FormControl>
                    <Input type="number" placeholder="Default (from settings)" {...field} />
                  </FormControl>
                   <FormDescription>Leave empty to use the default application setting.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                 {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChangingStatus, startStatusChangeTransition] = useTransition();

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      const usersFromDb = await getUsers();
      setUsers(usersFromDb);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch users.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleRefreshAndToast = () => {
    fetchUsers();
    toast({ title: 'User list refreshed'});
  }

  const handleStatusChange = (user: User, newStatus: string) => {
    startStatusChangeTransition(async () => {
        try {
            await updateUserRole(user.id, user.role, newStatus, user.dailyPostLimit?.toString() ?? null);
            toast({ title: 'Status Updated', description: `${user.name}'s status updated to ${newStatus}`});
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Manage Users</h1>
        <Button className="ml-auto" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
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
        <CardContent>
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
                          <EditUserDialog user={user} onUserUpdate={fetchUsers} />
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
                    No users found.
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
