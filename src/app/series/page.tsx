import { Suspense } from 'react';
import { getPosts } from '@/lib/actions/posts';
import { getSeriesById, getPostsBySeriesId, getPost } from '@/lib/actions';
import SeriesPageClient from './series-page-client';
import SeriesDetailClient from '@/components/series/series-detail-client';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import type { Post, Series } from '@/lib/types';

export const metadata: Metadata = {
    title: 'Series | Fiddle',
    description: 'Browse and discover the best series content on Fiddle.',
};

export const dynamic = 'force-dynamic';

interface SeriesPageProps {
    searchParams: Promise<{
        genre?: string;
        year?: string;
        sort?: string;
        page?: string;
        seriesId?: string;
        post?: string;
    }>;
}

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
    const params = await searchParams;

    // If seriesId is provided, show series detail view
    if (params.seriesId) {
        const seriesIdNum = Number(params.seriesId);
        if (isNaN(seriesIdNum)) {
            notFound();
        }

        const session = await auth();
        const user = session?.user;

        const seriesData = (await getSeriesById(seriesIdNum)) as Series | null;
        if (!seriesData) {
            notFound();
        }

        const postsDataRaw = (await getPostsBySeriesId(seriesIdNum)) as Post[];

        const currentPostIdFromSearch = params.post ? Number(params.post) : undefined;
        if (currentPostIdFromSearch && isNaN(currentPostIdFromSearch)) {
            notFound();
        }

        const currentPostId = currentPostIdFromSearch ?? postsDataRaw[0]?.id;
        if (!currentPostId) {
            notFound();
        }

        let currentPostData = (await getPost(currentPostId)) as Post | null;
        if (!currentPostData) {
            notFound();
        }

        const userSubmissions = user ? await prisma.examSubmission.findMany({
            where: {
                userId: user.id,
                exam: {
                    post: {
                        seriesId: seriesIdNum,
                    },
                },
            },
            include: {
                exam: {
                    include: {
                        questions: { select: { points: true } },
                    },
                },
            },
        }) : [];

        const passedExamIds = new Set<number>();
        userSubmissions.forEach(sub => {
            if (!sub.exam) return;
            const totalPoints = sub.exam.questions.reduce((sum, q) => sum + q.points, 0);
            const percentage = totalPoints > 0 ? (sub.score / totalPoints) * 100 : 0;
            if (percentage >= 50) {
                passedExamIds.add(sub.examId);
            }
        });

        const postsData = postsDataRaw.map((post, index) => {
            let isLocked = false;
            if (post.isLockedByDefault) {
                if (user && (user.role === ROLES.SUPER_ADMIN || user.id === post.authorId)) {
                    isLocked = false;
                } else {
                    if (index === 0) {
                        isLocked = true;
                    } else {
                        const previousPost = postsDataRaw[index - 1];
                        if (previousPost.requiresExamToUnlock) {
                            if (!previousPost.exam || !passedExamIds.has(previousPost.exam.id)) {
                                isLocked = true;
                            }
                        } else {
                            isLocked = true;
                        }
                    }
                }
            }
            return { ...post, isLocked };
        });

        const initialPostWithLockStatus = postsData.find(p => p.id === currentPostData?.id);
        if (initialPostWithLockStatus) {
            currentPostData.isLocked = initialPostWithLockStatus.isLocked;
        }

        return (
            <SeriesDetailClient
                series={seriesData}
                postsInSeries={postsData}
                initialPost={currentPostData}
                session={session}
                passedExamIds={passedExamIds}
            />
        );
    }

    // Otherwise show series list
    const page = parseInt(params.page || '1');
    const genre = params.genre;
    const year = params.year;

    const filters: any = { type: 'TV_SERIES' };
    if (genre) filters.genres = { has: genre };
    if (year) filters.year = parseInt(year);

    const { posts, totalPages } = await getPosts({
        page,
        limit: 24,
        filters
    });

    return (
        <Suspense fallback={<SeriesSkeleton />}>
            <SeriesPageClient
                initialPosts={posts}
                totalPages={totalPages}
                currentPage={page}
                searchParams={params}
            />
        </Suspense>
    );
}

function SeriesSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="h-10 w-40 bg-muted animate-pulse rounded mb-8" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(18)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
