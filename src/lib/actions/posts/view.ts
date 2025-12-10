'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function incrementViewCount(postId: number) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

        if (userId) {
            // Check if this registered user has already viewed the post
            const existingView = await prisma.postView.findUnique({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });

            if (!existingView) {
                // Transaction: Record view and increment counter
                await prisma.$transaction([
                    prisma.postView.create({
                        data: {
                            postId,
                            userId,
                            ip
                        }
                    }),
                    prisma.post.update({
                        where: { id: postId },
                        data: { viewCount: { increment: 1 } }
                    })
                ]);
            }
        } else {
            // Guest User: Check if this IP has already viewed the post (as a guest)
            const existingView = await prisma.postView.findFirst({
                where: {
                    postId,
                    ip,
                    userId: null
                }
            });

            if (!existingView) {
                await prisma.$transaction([
                    prisma.postView.create({
                        data: {
                            postId,
                            userId: null,
                            ip
                        }
                    }),
                    prisma.post.update({
                        where: { id: postId },
                        data: { viewCount: { increment: 1 } }
                    })
                ]);
            }
        }
    } catch (error) {
        console.error('Error incrementing view count:', error);
        // Fail silently - view counting shouldn't break the page
    }
}
