
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { Group, GroupMember, User, GroupRole } from '@prisma/client';
import { saveImageFromDataUrl, deleteUploadedFile } from './posts';


export async function uploadGroupProfileImage(formData: FormData): Promise<string | null> {
    const file = formData.get('image') as File;
    if (!file || file.size === 0) {
        return null;
    }
    const dataUrl = await file.arrayBuffer().then(buffer =>
        `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`
    );
    return saveImageFromDataUrl(dataUrl, 'groups/avatars');
}

export async function uploadGroupCoverImage(formData: FormData): Promise<string | null> {
    const file = formData.get('image') as File;
    if (!file || file.size === 0) {
        return null;
    }
    const dataUrl = await file.arrayBuffer().then(buffer =>
        `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`
    );
    return saveImageFromDataUrl(dataUrl, 'groups/covers');
}


export async function getGroups() {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        throw new Error('Not authorized');
    }

    // Step 1: Fetch all groups with their active member counts
    const groups = await prisma.group.findMany({
        include: {
            _count: {
                select: {
                    members: { where: { status: 'ACTIVE' } }
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    // Step 2: Get all pending request counts in a single query
    const pendingCounts = await prisma.groupMember.groupBy({
        by: ['groupId'],
        where: {
            status: 'PENDING',
            groupId: { in: groups.map(g => g.id) }
        },
        _count: {
            userId: true,
        },
    });

    // Step 3: Create a map for easy lookup
    const pendingCountsMap = new Map(
        (pendingCounts as any[]).map(item => [item.groupId, item._count.userId])
    );

    // Step 4: Combine the data
    const groupsWithAllCounts = groups.map((group: any) => ({
        ...group,
        _count: {
            members: group._count.members,
            pendingRequests: pendingCountsMap.get(group.id) || 0,
        },
    }));

    return groupsWithAllCounts;
}

export async function getGroupsForForm(): Promise<Pick<Group, 'id' | 'name'>[]> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Not authorized');
    }
    const groups = await prisma.group.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    });
    return groups;
}

export async function createGroup(name: string, description: string | null, isPremiumOnly: boolean = false): Promise<Group> {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const newGroup = await prisma.group.create({
        data: {
            name,
            description,
            isPremiumOnly,
            createdBy: { connect: { id: session.user.id } },
            visibility: 'PUBLIC', // Default visibility
        },
    });
    revalidatePath('/admin/groups');
    return newGroup;
}


export async function getGroupDetails(groupId: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }
    return prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                where: { status: 'ACTIVE' },
                include: {
                    user: true,
                },
                orderBy: {
                    joinedAt: 'asc'
                }
            },
        },
    });
}

export async function updateGroup(
    groupId: string,
    data: {
        name?: string;
        description?: string | null;
        profilePhoto?: string | null;
        coverPhoto?: string | null;
        isPremiumOnly?: boolean;
    }
) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Not authenticated');
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
        throw new Error('Group not found');
    }

    const canUpdate = session.user.role === ROLES.SUPER_ADMIN || session.user.id === group.createdById;
    if (!canUpdate) {
        throw new Error('Not authorized');
    }

    const currentGroup = await prisma.group.findUnique({
        where: { id: groupId },
        select: { profilePhoto: true, coverPhoto: true },
    });

    if (!currentGroup) {
        throw new Error('Group not found');
    }

    let finalProfilePhoto = data.profilePhoto;
    if (data.profilePhoto && data.profilePhoto.startsWith('data:image')) {
        finalProfilePhoto = await saveImageFromDataUrl(data.profilePhoto, 'groups/avatars');
        if (currentGroup.profilePhoto && currentGroup.profilePhoto.startsWith('/uploads/')) {
            await deleteUploadedFile(currentGroup.profilePhoto);
        }
    }

    let finalCoverPhoto = data.coverPhoto;
    if (data.coverPhoto && data.coverPhoto.startsWith('data:image')) {
        finalCoverPhoto = await saveImageFromDataUrl(data.coverPhoto, 'groups/covers');
        if (currentGroup.coverPhoto && currentGroup.coverPhoto.startsWith('/uploads/')) {
            await deleteUploadedFile(currentGroup.coverPhoto);
        }
    }

    const updateData = {
        name: data.name,
        description: data.description,
        profilePhoto: finalProfilePhoto,
        coverPhoto: finalCoverPhoto,
        isPremiumOnly: data.isPremiumOnly,
    };

    await prisma.group.update({
        where: { id: groupId },
        data: updateData,
    });

    revalidatePath(`/admin/groups`);
    revalidatePath(`/groups/${groupId}`);
}

export async function updateGroupMembers(groupId: string, newMemberIds: string[], memberRoles: Record<string, GroupRole>) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const existingMembers = await prisma.groupMember.findMany({
        where: { groupId, status: 'ACTIVE' },
    });
    const existingMemberIds = existingMembers.map(m => m.userId);

    const membersToAdd = newMemberIds.filter(id => !existingMemberIds.includes(id));
    const membersToRemove = existingMemberIds.filter(id => !newMemberIds.includes(id));
    const membersToUpdate = existingMembers.filter(m => newMemberIds.includes(m.userId) && memberRoles[m.userId] && memberRoles[m.userId] !== m.role);


    const transactions = [];

    // Remove members
    if (membersToRemove.length > 0) {
        transactions.push(prisma.groupMember.deleteMany({
            where: {
                groupId,
                userId: { in: membersToRemove },
            },
        }));
    }

    // Add new members
    if (membersToAdd.length > 0) {
        transactions.push(prisma.groupMember.createMany({
            data: membersToAdd.map(userId => ({
                groupId,
                userId,
                role: memberRoles[userId] || 'MEMBER',
                status: 'ACTIVE',
            })),
        }));
    }

    // Update existing member roles
    for (const member of membersToUpdate) {
        transactions.push(prisma.groupMember.update({
            where: {
                userId_groupId: {
                    userId: member.userId,
                    groupId: groupId,
                },
            },
            data: {
                role: memberRoles[member.userId],
            },
        }));
    }


    if (transactions.length > 0) {
        await prisma.$transaction(transactions);
    }

    revalidatePath('/admin/groups');
    revalidatePath(`/groups/${groupId}`);
}

export async function getGroupForProfile(groupId: string) {
    const session = await auth();
    const user = session?.user;

    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            _count: {
                select: { members: { where: { status: 'ACTIVE' } } },
            },
            members: {
                where: { status: 'ACTIVE' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                take: 10,
                orderBy: {
                    joinedAt: 'asc',
                }
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    if (!group) {
        return null;
    }

    let isMember = false;
    let membershipStatus: 'ACTIVE' | 'PENDING' | null = null;

    if (user) {
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: groupId,
                },
            },
        });
        if (membership) {
            isMember = membership.status === 'ACTIVE';
            membershipStatus = ['ACTIVE', 'PENDING'].includes(membership.status)
                ? (membership.status as 'ACTIVE' | 'PENDING')
                : null;
        }
    }

    const canViewPosts = group.visibility === 'PUBLIC' || isMember;

    const posts = canViewPosts ? await prisma.post.findMany({
        where: {
            groupId: groupId,
            status: 'PUBLISHED',
            OR: [
                { visibility: 'PUBLIC' },
                {
                    visibility: 'GROUP_ONLY',
                    AND: isMember ? [{}] : [{ id: { equals: -1 } }], // Block if not a member
                }
            ]
        },
        include: {
            author: true,
            likedBy: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    // role: true // If needed
                },
                take: 5,
            },
            _count: {
                select: {
                    likedBy: true,
                    reviews: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        }
    }) : [];

    return {
        ...group,
        posts,
        isMember,
        membershipStatus,
    };
}


export async function getPublicGroups(limit = 10) {
    const groups = await prisma.group.findMany({
        where: {
            visibility: 'PUBLIC',
        },
        include: {
            _count: {
                select: { members: { where: { status: 'ACTIVE' } } },
            },
            posts: {
                take: 1,
                select: {
                    posterUrl: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
        orderBy: {
            members: {
                _count: 'desc',
            },
        },
        take: limit,
    });
    return groups.map((group: any) => ({
        ...group,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
        posts: group.posts.map((post: any) => ({ ...post }))
    }));
}

export async function requestToJoinGroup(groupId: string) {
    const session = await auth();
    const user = session?.user;
    if (!user) {
        throw new Error("You must be logged in to join a group.");
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
        throw new Error("Group not found.");
    }

    // Check for Premium Only Restriction
    if (group.isPremiumOnly) {
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { accountType: true, subscriptionEndDate: true }
        });

        const isPremium = fullUser?.accountType === 'PREMIUM' || (fullUser?.subscriptionEndDate && new Date(fullUser.subscriptionEndDate) > new Date());

        if (!isPremium) {
            throw new Error("This group is exclusive to Premium members. Please upgrade your account to join.");
        }
    }


    const existingMembership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.id, groupId: groupId } }
    });

    if (existingMembership) {
        if (existingMembership.status === 'ACTIVE') {
            throw new Error("You are already a member of this group.");
        } else if (existingMembership.status === 'PENDING') {
            throw new Error("Your request to join this group is already pending.");
        }
    }

    const canJoinDirectly = user.role === ROLES.SUPER_ADMIN || group.createdById === user.id;

    const status = canJoinDirectly ? 'ACTIVE' : 'PENDING';

    await prisma.groupMember.upsert({
        where: { userId_groupId: { userId: user.id, groupId: groupId } },
        update: {
            status: status,
            role: 'MEMBER'
        },
        create: {
            groupId: groupId,
            userId: user.id,
            status: status,
            role: 'MEMBER'
        }
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath('/admin/groups');
    return { status };
}

export async function leaveGroup(groupId: string) {
    const session = await auth();
    const user = session?.user;
    if (!user) {
        throw new Error("You must be logged in to leave a group.");
    }

    const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.id, groupId: groupId } }
    });

    if (!membership) {
        throw new Error("You are not a member of this group.");
    }

    await prisma.groupMember.delete({
        where: { userId_groupId: { userId: user.id, groupId: groupId } }
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath('/admin/groups');
}

export async function getPendingGroupRequests(groupId: string) {
    const session = await auth();
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { createdById: true } });
    if (!group) throw new Error("Group not found");

    const canView = session?.user && (session.user.role === ROLES.SUPER_ADMIN || session.user.id === group.createdById);
    if (!canView) {
        throw new Error("Not authorized");
    }
    return prisma.groupMember.findMany({
        where: {
            groupId,
            status: 'PENDING',
        },
        include: {
            user: true,
        },
        orderBy: {
            joinedAt: 'asc'
        }
    });
}

export async function manageGroupJoinRequest(groupId: string, userId: string, action: 'APPROVE' | 'REJECT') {
    const session = await auth();
    const actor = session?.user;

    const group = await prisma.group.findUnique({ where: { id: groupId }, include: { members: { where: { role: 'ADMIN' } } } });
    if (!group) {
        throw new Error("Group not found");
    }

    const canManage = actor?.role === ROLES.SUPER_ADMIN || group.createdById === actor?.id || (group as any).members.some((m: any) => m.userId === actor?.id);
    if (!canManage) {
        throw new Error("Not authorized to manage requests for this group.");
    }

    const request = await prisma.groupMember.findUnique({
        where: {
            userId_groupId: { userId, groupId },
            status: 'PENDING',
        }
    });

    if (!request) {
        throw new Error("No pending request found for this user.");
    }

    if (action === 'APPROVE') {
        await prisma.groupMember.update({
            where: { userId_groupId: { userId, groupId } },
            data: { status: 'ACTIVE' },
        });
    } else { // REJECT
        await prisma.groupMember.delete({
            where: { userId_groupId: { userId, groupId } },
        });
    }

    revalidatePath('/admin/groups');
    revalidatePath(`/groups/${groupId}`);
}


export async function getUserJoinedGroups() {
    const session = await auth();
    const user = session?.user;
    if (!user) return [];

    const members = await prisma.groupMember.findMany({
        where: {
            userId: user.id,
            status: 'ACTIVE'
        },
        select: {
            group: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true
                }
            }
        },
        orderBy: {
            joinedAt: 'desc'
        }
    });

    return (members as any[]).map(m => m.group);
}

export async function getUserGroupsExtended() {
    const session = await auth();
    const user = session?.user;
    if (!user) return { joined: [], created: [] };

    const joinedMemberships = await prisma.groupMember.findMany({
        where: {
            userId: user.id,
            status: 'ACTIVE'
        },
        include: {
            group: {
                include: {
                    _count: {
                        select: { members: { where: { status: 'ACTIVE' } } }
                    }
                }
            }
        },
        orderBy: {
            joinedAt: 'desc'
        }
    });

    const createdGroups = await prisma.group.findMany({
        where: {
            createdById: user.id
        },
        include: {
            _count: {
                select: { members: { where: { status: 'ACTIVE' } } }
            }
        },
        orderBy: { name: 'asc' }
    });

    return {
        joined: joinedMemberships.map(m => ({ ...m.group, joinedAt: m.joinedAt.toISOString(), role: m.role })),
        created: createdGroups
    };
}

export async function getUserGroupFeed(page = 1, limit = 10) {
    const session = await auth();
    const user = session?.user;
    if (!user) return { posts: [], totalPages: 0 };

    // Get IDs of groups user is a member of
    const memberships = await prisma.groupMember.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        select: { groupId: true }
    });
    const groupIds = memberships.map(m => m.groupId);

    if (groupIds.length === 0) return { posts: [], totalPages: 0 };

    const where = {
        groupId: { in: groupIds },
        status: 'PUBLISHED',
    };

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            include: {
                author: true,
                group: { select: { id: true, name: true, profilePhoto: true } },
                likedBy: { select: { id: true } },
                _count: { select: { reviews: true, likedBy: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.post.count({ where })
    ]);

    return {
        posts: posts.map((post: any) => ({
            ...post,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            isLiked: post.likedBy.some((u: any) => u.id === user.id)
        })),
        totalPages: Math.ceil(total / limit)
    };
}
