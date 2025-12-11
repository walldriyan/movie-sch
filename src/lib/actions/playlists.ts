'use server';
// Cache cleaned and Prisma Client regenerated

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ROLES } from '@/lib/permissions';

async function checkAdmin() {
    const session = await auth();
    // Allow SUPER_ADMIN or USER_ADMIN (content managers)
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        throw new Error('Unauthorized');
    }
    return session;
}

// --- FETCHING ---

export async function getPlaylists() {
    return await prisma.playlist.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { items: true } } }
    });
}

export async function getActivePlaylist() {
    return await prisma.playlist.findFirst({
        where: { isActive: true },
        include: {
            items: {
                orderBy: { order: 'asc' }
            }
        }
    });
}

export async function getPlaylist(id: string) {
    return await prisma.playlist.findUnique({
        where: { id },
        include: {
            items: {
                orderBy: { order: 'asc' }
            }
        }
    });
}

// --- MUTATIONS ---

export async function createPlaylist(name: string) {
    await checkAdmin();

    // If first playlist, make it active
    const count = await prisma.playlist.count();

    const playlist = await prisma.playlist.create({
        data: {
            name,
            isActive: count === 0
        }
    });

    revalidatePath('/admin');
    return { success: true, playlist };
}

export async function deletePlaylist(id: string) {
    await checkAdmin();
    await prisma.playlist.delete({ where: { id } });
    revalidatePath('/admin');
    return { success: true };
}

export async function toggleActivePlaylist(id: string) {
    await checkAdmin();

    // Deactivate all others
    await prisma.playlist.updateMany({
        where: { id: { not: id } },
        data: { isActive: false }
    });

    // Activate target
    await prisma.playlist.update({
        where: { id },
        data: { isActive: true }
    });

    revalidatePath('/'); // Refresh home
    revalidatePath('/admin');
    return { success: true };
}

export async function addPlaylistItem(playlistId: string, data: { title: string, url: string, type: 'MP3' | 'YOUTUBE', artist?: string, image?: string }) {
    await checkAdmin();

    const count = await prisma.playlistItem.count({ where: { playlistId } });

    await prisma.playlistItem.create({
        data: {
            playlistId,
            title: data.title,
            url: data.url,
            type: data.type,
            artist: data.artist,
            image: data.image,
            order: count // append to end
        }
    });

    revalidatePath(`/admin/playlists/${playlistId}`);
    return { success: true };
}

export async function deletePlaylistItem(itemId: string) {
    await checkAdmin();
    await prisma.playlistItem.delete({ where: { id: itemId } });
    return { success: true };
}
