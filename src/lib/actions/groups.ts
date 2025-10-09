'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { Group } from '@prisma/client';


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
            createdById: session.user.id,
        },
    });
    revalidatePath('/admin/groups');
    return newGroup;
}


export async function getGroupDetails(groupId: number) {
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
            },
        },
    });
}

export async function updateGroupMembers(groupId: number, newMemberIds: string[]) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const existingMembers = await prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true },
    });
    const existingMemberIds = existingMembers.map(m => m.userId);

    const membersToAdd = newMemberIds.filter(id => !existingMemberIds.includes(id));
    const membersToRemove = existingMemberIds.filter(id => !newMemberIds.includes(id));

    await prisma.$transaction([
        // Remove members
        prisma.groupMember.deleteMany({
            where: {
                groupId,
                userId: { in: membersToRemove },
            },
        }),
        // Add new members
        prisma.groupMember.createMany({
            data: membersToAdd.map(userId => ({
                groupId,
                userId,
                role: 'MEMBER', // Default role
            })),
        }),
    ]);
    
    revalidatePath('/admin/groups');
}
