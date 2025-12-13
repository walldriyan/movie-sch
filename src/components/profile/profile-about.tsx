'use client';

import Link from 'next/link';
import {
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
import { Badge } from '@/components/ui/badge';
import RequestAccessDialog from '@/components/request-access-dialog';
import { ROLES } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ProfileAboutProps {
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

export default function ProfileAbout({ profileUser, loggedInUser }: ProfileAboutProps) {
    const isOwnProfile = loggedInUser?.id === profileUser.id;
    const showRequestAccess = isOwnProfile && loggedInUser?.role === ROLES.USER && profileUser.permissionRequestStatus !== 'APPROVED';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Bio / About Section */}
            <Card className="bg-[#111112] border border-white/[0.02] text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        About
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {profileUser.bio ? (
                        <p className="text-white/70 leading-relaxed">
                            {profileUser.bio}
                        </p>
                    ) : (
                        <p className="text-white/40 italic">
                            No bio added yet.
                        </p>
                    )}

                    {/* Social Links */}
                    {(profileUser.website || profileUser.twitter || profileUser.linkedin) && (
                        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-white/[0.05]">
                            {profileUser.website && (
                                <Link
                                    href={profileUser.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm"
                                >
                                    <Globe className="w-4 h-4" />
                                    <span>Website</span>
                                </Link>
                            )}
                            {profileUser.twitter && (
                                <Link
                                    href={profileUser.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm"
                                >
                                    <Twitter className="w-4 h-4" />
                                    <span>Twitter</span>
                                </Link>
                            )}
                            {profileUser.linkedin && (
                                <Link
                                    href={profileUser.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm"
                                >
                                    <Linkedin className="w-4 h-4" />
                                    <span>LinkedIn</span>
                                </Link>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* My Account Card - Only for own profile */}
                {isOwnProfile && loggedInUser && (
                    <Card className="bg-[#111112] border border-white/[0.02] text-white h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                Account Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Email */}
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/5">
                                    <Mail className="w-5 h-5 text-white/50" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Email</span>
                                    <span className="text-white/80 font-medium">{profileUser.email}</span>
                                </div>
                            </div>

                            {/* Role */}
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/5">
                                    <Award className="w-5 h-5 text-white/50" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Role</span>
                                    <Badge
                                        className={cn(
                                            "w-fit",
                                            loggedInUser.role === ROLES.SUPER_ADMIN && "bg-purple-500/20 text-purple-300 border-purple-500/30",
                                            loggedInUser.role === ROLES.USER_ADMIN && "bg-blue-500/20 text-blue-300 border-blue-500/30",
                                            loggedInUser.role === ROLES.USER && "bg-white/10 text-white/60 border-white/20"
                                        )}
                                    >
                                        {loggedInUser.role.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>

                            {/* Permissions */}
                            {loggedInUser.permissions && loggedInUser.permissions.length > 0 && (
                                <div className="pt-6 border-t border-white/[0.05]">
                                    <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-3">Active Permissions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {loggedInUser.permissions.map(permission => (
                                            <Badge
                                                key={permission}
                                                variant="outline"
                                                className="text-xs text-white/60 border-white/10 font-mono py-1"
                                            >
                                                {permission}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Request Access */}
                            {showRequestAccess && (
                                <div className="pt-6 border-t border-white/[0.05]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-purple-400" />
                                        <p className="text-sm font-medium text-white">Become a Creator</p>
                                    </div>
                                    <p className="text-xs text-white/50 mb-4 leading-relaxed">
                                        Request access to create and manage content on the platform.
                                    </p>
                                    <RequestAccessDialog user={profileUser} />
                                </div>
                            )}

                            {/* Permission Status */}
                            <PermissionStatusIndicator status={profileUser.permissionRequestStatus} />
                        </CardContent>
                    </Card>
                )}

                {/* Achievements Placeholder */}
                <Card className="bg-[#111112] border border-white/[0.02] text-white h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-400" />
                            Achievements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {['🎬', '⭐', '🏆'].map((emoji, i) => (
                                <div key={i} className="aspect-square rounded-2xl bg-white/[0.03] border border-white/[0.02] flex items-center justify-center text-4xl grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title="Locked Achievement">
                                    {emoji}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.02] text-center">
                            <p className="text-sm text-white/40">Achievements system is coming soon!</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
