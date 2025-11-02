
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

const userEditSchema = z.object({
  role: z.nativeEnum(ROLES),
  dailyPostLimit: z.string().optional(),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;


function EditUserDialog({ user, onUserUpdate }: { user: User; onUserUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      role: user.role as keyof typeof ROLES,
      dailyPostLimit: user.dailyPostLimit?.toString() || '',
    },
  });

  const onSubmit = (data: UserEditFormValues) => {
    startTransition(async () => {
      try {
        let newStatus: string | null = user.permissionRequestStatus;
        if (user.permissionRequestStatus === 'PENDING') {
          newStatus = data.role === ROLES.USER ? 'REJECTED' : 'APPROVED';
        }
        
        await updateUserRole(user.id, data.role, newStatus!, data.dailyPostLimit || null);
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
            Modify user role and set content limits.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ROLES).map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
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
