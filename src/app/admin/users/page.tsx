

'use client';

import { useState, useEffect, useTransition } from 'react';
import type { User, Role } from '@prisma/client';
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
            await updateUserRole(user.id, user.role as Role, newStatus, user.dailyPostLimit?.toString() ?? null);
            toast({ title: 'Status Updated', description: `${user.name}'s status updated to ${newStatus}`});
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    });
  }

  const handleRoleChange = (user: User, newRole: Role) => {
    startStatusChangeTransition(async () => {
        try {
            await updateUserRole(user.id, newRole, user.permissionRequestStatus || 'NONE', user.dailyPostLimit?.toString() ?? null);
            toast({ title: 'Role Updated', description: `${user.name}'s role updated to ${newRole}`});
            fetchUsers();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    });
  };

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
