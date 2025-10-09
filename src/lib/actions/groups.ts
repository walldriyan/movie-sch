
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { Group, GroupMember, User, Role as MemberRole } from '@prisma/client';


export async function getGroups() {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        throw new Error('Not authorized');
    }
    return prisma.group.findMany({
        include: {
            _count: {
                select: { members: true },
            },
        },
        orderBy: { name: 'asc' },
    });
}

export async function createGroup(name: string, description: string | null): Promise<Group> {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const newGroup = await prisma.group.create({
        data: {
            name,
            description,
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

export async function updateGroupMembers(groupId: string, newMemberIds: string[], memberRoles: Record<string, MemberRole>) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const existingMembers = await prisma.groupMember.findMany({
        where: { groupId },
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
                role: memberRoles[userId] || 'MEMBER', // Default to MEMBER if not specified
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
                select: { members: true },
            },
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
                take: 10, // Limit initial members shown
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
    
    let canViewPosts = group.visibility === 'PUBLIC';
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
            if (membership.status === 'ACTIVE') {
                 canViewPosts = true;
                 isMember = true;
                 membershipStatus = 'ACTIVE';
            } else if (membership.status === 'PENDING') {
                membershipStatus = 'PENDING';
            }
        }
    }
    
    let posts = [];
    if (canViewPosts) {
        posts = await prisma.post.findMany({
            where: { 
                groupId: groupId,
                status: 'PUBLISHED'
            },
            include: {
                author: true,
            }
        });
    }

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
        select: { members: true },
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
  return groups;
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
    
    const existingMembership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.id, groupId: groupId } }
    });

    if (existingMembership) {
        throw new Error("You are already a member or your request is pending.");
    }

    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
    const isGroupCreator = group.createdById === user.id;

    // Super Admins and the group creator can join directly without approval
    const status = isSuperAdmin || isGroupCreator || group.visibility === 'PUBLIC' 
        ? 'ACTIVE' 
        : 'PENDING';

    await prisma.groupMember.create({
        data: {
            groupId: groupId,
            userId: user.id,
            status: status,
            role: 'MEMBER'
        }
    });

    revalidatePath(`/groups/${groupId}`);
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
}
