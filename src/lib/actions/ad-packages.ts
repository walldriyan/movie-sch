'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function getAdPackages() {
    try {
        const packages = await prisma.adPackage.findMany({
            where: { isActive: true },
            orderBy: { pricePerDay: 'asc' }
        });
        return { success: true, data: packages };
    } catch (error) {
        return { success: false, error: 'Failed to fetch ad packages' };
    }
}

export async function getAllAdPackagesInternal() {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Unauthorized');
    }
    return await prisma.adPackage.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createAdPackage(data: { name: string, description?: string, pricePerDay: number, minDays: number, maxDays: number }) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.adPackage.create({
            data: {
                ...data
            }
        });
        revalidatePath('/admin/ads');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}

export async function updateAdPackage(id: string, data: Partial<{ name: string, description: string, pricePerDay: number, minDays: number, maxDays: number, isActive: boolean }>) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.adPackage.update({
            where: { id },
            data
        });
        revalidatePath('/admin/ads');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}

export async function deleteAdPackage(id: string) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.adPackage.delete({
            where: { id }
        });
        revalidatePath('/admin/ads');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}
