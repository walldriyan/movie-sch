
'use client';

import Link from 'next/link';
import {
  Link as LinkIcon,
  Twitter,
  Linkedin,
  ShieldCheck,
  Hourglass,
  CheckCircle2,
  XCircle,
  Globe,
  Mail,
  Award,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { User } from '@prisma/client';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import RequestAccessDialog from '@/components/request-access-dialog';
import { ROLES } from '@/lib/permissions';
import EditProfileDialog from '../edit-profile-dialog';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface ProfileSidebarProps {
  profileUser: User;
  loggedInUser: (User & { role: string; permissions: string[] }) | undefined;
}

const PermissionStatusIndicator = ({ status }: { status: string | null }) => {
  if (!status || status === 'NONE') return null;

  const statusMap = {
    PENDING: {
      icon: <Hourglass className="h-4 w-4" />,
      text: 'Permission Pending',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Your request is being reviewed.',
    },
    APPROVED: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: 'Request Approved',
      className: 'bg-green-500/10 text-green-400 border-green-500/20',
      description: 'Please log out and back in to apply changes.',
    },
    REJECTED: {
      icon: <XCircle className="h-4 w-4" />,
      text: 'Request Rejected',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
      description: 'You can submit another request.',
    },
  };

  const currentStatus = statusMap[status as keyof typeof statusMap];
  if (!currentStatus) return null;

  return (
    <div className={cn(
      "rounded-xl p-4 text-sm border backdrop-blur-sm",
      currentStatus.className
    )}>
      <div className="flex items-center gap-2 font-semibold">
        {currentStatus.icon}
        <span>{currentStatus.text}</span>
      </div>
      {currentStatus.description && (
        <p className="text-xs mt-2 opacity-80">{currentStatus.description}</p>
      )}
    </div>
  );
};

export default function ProfileSidebar({ profileUser, loggedInUser }: ProfileSidebarProps) {
  const isOwnProfile = loggedInUser?.id === profileUser.id;
  const showRequestAccess = isOwnProfile && loggedInUser?.role === ROLES.USER && profileUser.permissionRequestStatus !== 'APPROVED';

  return (
    <div className="space-y-6">
      {/* About Card */}
      <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          About
        </h3>

        {profileUser.bio ? (
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            {profileUser.bio}
          </p>
        ) : (
          <p className="text-white/40 text-sm italic mb-4">
            No bio added yet.
          </p>
        )}

        {/* Social Links */}
        {(profileUser.website || profileUser.twitter || profileUser.linkedin) && (
          <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
            {profileUser.website && (
              <Link
                href={profileUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <Globe className="w-4 h-4" />
              </Link>
            )}
            {profileUser.twitter && (
              <Link
                href={profileUser.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <Twitter className="w-4 h-4" />
              </Link>
            )}
            {profileUser.linkedin && (
              <Link
                href={profileUser.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <Linkedin className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* My Account Card - Only for own profile */}
      {isOwnProfile && loggedInUser && (
        <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            My Account
          </h3>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-white/5">
                <Mail className="w-4 h-4 text-white/40" />
              </div>
              <span className="text-white/60 truncate">{profileUser.email}</span>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-white/5">
                <Award className="w-4 h-4 text-white/40" />
              </div>
              <Badge
                className={cn(
                  "text-xs",
                  loggedInUser.role === ROLES.SUPER_ADMIN && "bg-purple-500/20 text-purple-300 border-purple-500/30",
                  loggedInUser.role === ROLES.USER_ADMIN && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                  loggedInUser.role === ROLES.USER && "bg-white/10 text-white/60 border-white/20"
                )}
              >
                {loggedInUser.role.replace('_', ' ')}
              </Badge>
            </div>

            {/* Permissions */}
            {loggedInUser.permissions && loggedInUser.permissions.length > 0 && (
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-xs text-white/40 mb-2">Permissions</p>
                <div className="flex flex-wrap gap-1.5">
                  {loggedInUser.permissions.map(permission => (
                    <Badge
                      key={permission}
                      variant="outline"
                      className="text-[10px] text-white/50 border-white/10 font-mono"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Request Access */}
            {showRequestAccess && (
              <div className="pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-medium text-white">Become a Creator</p>
                </div>
                <p className="text-xs text-white/40 mb-3">
                  Request access to create and manage content.
                </p>
                <RequestAccessDialog user={profileUser} />
              </div>
            )}

            {/* Permission Status */}
            <PermissionStatusIndicator status={profileUser.permissionRequestStatus} />
          </div>
        </div>
      )}

      {/* Achievements Placeholder */}
      <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Achievements
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {['🎬', '⭐', '🏆'].map((emoji, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/[0.03] flex items-center justify-center text-2xl">
              {emoji}
            </div>
          ))}
        </div>
        <p className="text-xs text-white/30 text-center mt-3">More achievements coming soon!</p>
      </div>
    </div>
  );
}
