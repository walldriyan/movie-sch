import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        if (query.length < 2) {
            return NextResponse.json({ posts: [] });
        }

        // Use simple contains for SQLite compatibility (case-sensitive)
        // For case-insensitive search, we search with the query as-is
        const posts = await prisma.post.findMany({
            where: {
                AND: [
                    { status: 'PUBLISHED' },
                    {
                        OR: [
                            { title: { contains: query } },
                            { description: { contains: query } },
                            // Also search lowercase version
                            { title: { contains: query.toLowerCase() } },
                            { title: { contains: query.toUpperCase() } },
                        ]
                    }
                ]
            },
            select: {
                id: true,
                title: true,
                type: true,
                posterUrl: true,
                author: {
                    select: {
                        name: true
                    }
                }
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ posts: [], error: 'Search failed' }, { status: 500 });
    }
}
