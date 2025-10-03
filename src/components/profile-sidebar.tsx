
import Link from 'next/link';
import {
  Link as LinkIcon,
  Twitter,
  Linkedin,
  ShieldCheck,
  Hourglass,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { User } from '@prisma/client';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RequestAccessDialog from '@/components/request-access-dialog';
import { ROLES } from '@/lib/permissions';
import { ScrollArea } from './ui/scroll-area';
import EditProfileDialog from './edit-profile-dialog';

interface ProfileSidebarProps {
  profileUser: User;
  loggedInUser: (User & { role: string; permissions: string[] }) | undefined;
}

const PermissionStatusIndicator = ({ status }: { status: string | null }) => {
    if (!status || status === 'NONE') return null;
  
    const statusMap = {
      PENDING: {
        icon: <Hourglass className="h-4 w-4" />,
        text: 'Permission request is pending approval.',
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        description: null,
      },
      APPROVED: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        text: 'Request Approved',
        className: 'bg-green-500/10 text-green-400 border-green-500/20',
        description: 'Your role has been updated. Please log out and log back in to see the changes.',
      },
      REJECTED: {
        icon: <XCircle className="h-4 w-4" />,
        text: 'Request Rejected',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
        description: 'Your request was not approved. You can submit another request if needed.',
      },
    };
  
    const currentStatus = statusMap[status as keyof typeof statusMap];
    if (!currentStatus) return null;
  
    return (
      <div className={`mt-4 rounded-lg p-3 text-sm border ${currentStatus.className}`}>
        <div className="flex items-center gap-3 font-semibold">
          {currentStatus.icon}
          <span>{currentStatus.text}</span>
        </div>
        {currentStatus.description && (
          <p className="text-xs mt-2 ml-1">{currentStatus.description}</p>
        )}
      </div>
    );
};

export default function ProfileSidebar({ profileUser, loggedInUser }: ProfileSidebarProps) {
    const isOwnProfile = loggedInUser?.id === profileUser.id;
    const showRequestAccess = isOwnProfile && loggedInUser?.role === ROLES.USER && profileUser.permissionRequestStatus !== 'APPROVED';

    return (
        <div className="space-y-6">
           <div className="flex justify-between items-start">
             <div>
                <h2 className="text-2xl font-bold">{profileUser.name}</h2>
                <p className="text-muted-foreground text-sm">{profileUser.email}</p>
             </div>
           </div>

          {profileUser.bio && (
            <p className="text-muted-foreground text-sm">
              {profileUser.bio}
            </p>
          )}
          <Separator />
          <div className="flex items-center gap-4 text-muted-foreground">
            {profileUser.website && (
              <Link
                href={profileUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <LinkIcon className="w-5 h-5" />
              </Link>
            )}
            {profileUser.twitter && (
              <Link
                href={profileUser.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <Twitter className="w-5 h-5" />
              </Link>
            )}
            {profileUser.linkedin && (
              <Link
                href={profileUser.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                <Linkedin className="w-5 h-5" />
              </Link>
            )}
          </div>

          {isOwnProfile && loggedInUser && (
            <>
              <Separator />
              <Card className='border-0 shadow-none -mx-6 bg-transparent'>
                <CardHeader className='px-6'>
                  <CardTitle className="text-lg">My Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Role</h4>
                    <div className="text-sm">
                      <Badge variant={loggedInUser.role === ROLES.SUPER_ADMIN ? 'default' : loggedInUser.role === ROLES.USER_ADMIN ? 'secondary' : 'outline'}>
                        {loggedInUser.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4"/>
                      Permissions
                    </h4>
                    {loggedInUser.permissions && loggedInUser.permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {loggedInUser.permissions.map(permission => (
                          <Badge key={permission} variant="outline" className="font-mono text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No special permissions.</p>
                    )}
                  </div>
                  {showRequestAccess && (
                    <div>
                      <Separator className="my-4" />
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        Become a Contributor
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Want to add or manage movies? Request admin access to become a contributor.
                      </p>
                      <RequestAccessDialog user={profileUser} />
                    </div>
                  )}
                  <PermissionStatusIndicator status={profileUser.permissionRequestStatus} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
    );
}
