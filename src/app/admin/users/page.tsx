'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  PlusCircle,
  ShieldQuestion,
  Check,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/permissions';

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const usersFromDb = await getUsers();
      setUsers(usersFromDb);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch users.',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      let newStatus = user.permissionRequestStatus;
      if (user.permissionRequestStatus === 'PENDING') {
        newStatus = newRole === ROLES.USER ? 'REJECTED' : 'APPROVED';
      }

      await updateUserRole(userId, newRole, newStatus);
      await fetchUsers(); // Refetch users to update the list
      toast({
        title: 'Success',
        description: `User role updated successfully.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user role.',
      });
    }
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
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
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
                        <p className="text-xs text-muted-foreground mt-1 italic">
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
                            <DropdownMenuSubTrigger>
                              Change Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={user.role}
                                  onValueChange={(newRole) =>
                                    handleRoleChange(user.id, newRole)
                                  }
                                >
                                  {Object.values(ROLES).map((role) => (
                                    <DropdownMenuRadioItem
                                      key={role}
                                      value={role}
                                    >
                                      {role}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
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
                  <TableCell colSpan={4} className="h-24 text-center">
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
