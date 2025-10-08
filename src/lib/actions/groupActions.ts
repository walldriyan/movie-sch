
'use server';

import { PrismaClient, Group, Series, GroupMemberRole, Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { ROLES } from '@/lib/permissions';

const prisma = new PrismaClient();

// Group Actions
export async function getGroups() {
    const groups = await prisma.group.findMany({
        include: {
            _count: {
                select: { members: { where: { role: { not: 'PENDING' } } } },
            },
        },
        orderBy: { name: 'asc' },
    });

    const groupsWithPendingCount = await Promise.all(groups.map(async (group) => {
        const pendingCount = await prisma.groupMember.count({
            where: {
                groupId: group.id,
                role: 'PENDING',
            },
        });
        return {
            ...group,
            pendingMembersCount: pendingCount,
        };
    }));

    return groupsWithPendingCount;
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
            authorId: session.user.id
        },
    });
    revalidatePath('/admin/groups');
    return newGroup;
}


export async function getGroupDetails(groupId: number) {
    const session = await auth();
    if (!session?.user) {
        // Allow any logged in user to view group details
        return null;
    }
    return prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                include: {
                    user: true,
                },
                orderBy: {
                    role: 'asc'
                }
            },
            author: true
        },
    });
}

export async function updateGroupMembers(groupId: number, newMemberIds: string[]) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const existingMembers = await prisma.groupMember.findMany({
        where: { groupId, role: { in: ['MEMBER', 'ADMIN']} },
        select: { userId: true },
    });
    const existingMemberIds = existingMembers.map(m => m.userId);

    const membersToAdd = newMemberIds.filter(id => !existingMemberIds.includes(id));
    const membersToRemove = existingMemberIds.filter(id => !newMemberIds.includes(id));

    await prisma.$transaction([
        prisma.groupMember.deleteMany({
            where: {
                groupId,
                userId: { in: membersToRemove },
            },
        }),
        prisma.groupMember.createMany({
            data: membersToAdd.map(userId => ({
                groupId,
                userId,
                role: 'MEMBER',
            })),
        }),
    ]);
    
    revalidatePath('/admin/groups');
    revalidatePath(`/groups/${groupId}`);
}

export async function requestToJoinGroup(groupId: number) {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        throw new Error("You must be logged in to join a group.");
    }
    
    const existingMembership = await prisma.groupMember.findFirst({
        where: {
            groupId,
            userId: user.id
        }
    });

    if (existingMembership) {
        throw new Error("You are already a member or have a pending request for this group.");
    }

    await prisma.groupMember.create({
        data: {
            groupId,
            userId: user.id,
            role: 'PENDING'
        }
    });

    revalidatePath(`/groups/${groupId}`);
}

export async function respondToGroupRequest(membershipId: number, approved: boolean) {
    const session = await auth();
    const user = session?.user;

    if (!user) throw new Error("Not authenticated.");

    const membership = await prisma.groupMember.findUnique({
        where: { id: membershipId },
        include: { group: { select: { authorId: true } } }
    });

    if (!membership) throw new Error("Membership request not found.");

    const isGroupOwner = membership.group.authorId === user.id;
    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

    if (!isGroupOwner && !isSuperAdmin) {
        throw new Error("You are not authorized to manage requests for this group.");
    }

    if (approved) {
        await prisma.groupMember.update({
            where: { id: membershipId },
            data: { role: 'MEMBER' }
        });
    } else {
        await prisma.groupMember.delete({
            where: { id: membershipId }
        });
    }
    
    revalidatePath(`/groups/${membership.groupId}`);
    revalidatePath('/admin/groups');
}

export async function leaveGroup(groupId: number) {
    const session = await auth();
    const user = session?.user;
    if (!user) throw new Error("Not authenticated.");

    const membership = await prisma.groupMember.findFirst({
        where: {
            groupId,
            userId: user.id
        }
    });
    
    if (!membership) throw new Error("You are not a member of this group.");
    
    await prisma.groupMember.delete({
        where: { id: membership.id }
    });

    revalidatePath(`/groups/${groupId}`);
}

export async function getSeries(): Promise<Series[]> {
  const series = await prisma.series.findMany({
    orderBy: { title: 'asc' },
  });
  return series;
}

export async function createSeries(title: string): Promise<Series> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authorized: You must be logged in to create a series.');
  }

  const existingSeries = await prisma.series.findFirst({
    where: { 
      title: {
        equals: title,
      }
    },
  });

  if (existingSeries) {
    throw new Error(`A series with the title "${title}" already exists.`);
  }

  const newSeries = await prisma.series.create({
    data: {
      title,
      authorId: session.user.id,
    },
  });
  
  revalidatePath('/manage');
  return newSeries;
}


export async function getSeriesById(id: number): Promise<Series | null> {
  const series = await prisma.series.findUnique({
    where: { id },
  });
  return series;
}


export async function getSeriesByAuthorId(authorId: string, limit?: number) {
  const where = { authorId: authorId };
  
  const seriesQuery: Prisma.SeriesFindManyArgs = {
    where,
    include: {
      _count: {
        select: { posts: true },
      },
      posts: {
        orderBy: {
          orderInSeries: 'asc',
        },
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  };
  
  if (limit) {
    seriesQuery.take = limit;
  }
  
  const series = await prisma.series.findMany(seriesQuery);
  
  const totalSeries = await prisma.series.count({ where });


  const processedSeries = series.map(s => ({
    ...s,
    posts: s.posts.map(p => ({
      ...p,
      genres: p.genres ? p.genres.split(',') : [],
    }))
  }))

  return { series: processedSeries, totalSeries };
}

export async function updateGroup(groupId: number, data: { name: string; description?: string | null }) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }
    await prisma.group.update({
        where: { id: groupId },
        data,
    });
    revalidatePath('/admin/groups');
}

export async function deleteGroup(groupId: number) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }
    await prisma.$transaction([
        prisma.groupMember.deleteMany({ where: { groupId } }),
        prisma.group.delete({ where: { id: groupId } }),
    ]);
    revalidatePath('/admin/groups');
}
