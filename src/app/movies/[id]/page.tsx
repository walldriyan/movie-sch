
import { notFound, redirect } from 'next/navigation';
import { getPost } from '@/lib/actions/posts/read';
import { auth } from '@/auth';
import MoviePageContent from '@/components/movie/movie-page-content';
import { ROLES } from '@/lib/permissions';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return { title: 'Movie Not Found' };

    const post = await getPost(id);
    if (!post) return { title: 'Movie Not Found' };

    return {
        title: post.title,
        description: post.description,
    };
}

export default async function MoviePage({ params }: Props) {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) notFound();

    const post = await getPost(id);
    if (!post) notFound();

    const session = await auth();
    const user = session?.user;

    // Premium / Access Control
    const isPremiumGroup = (post as any).group?.isPremiumOnly;

    const hasAccess = (() => {
        if (!isPremiumGroup) return true;
        if (!user) return false;
        if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER_ADMIN) return true;
        if (user.accountType === 'PREMIUM' || user.accountType === 'HYBRID') return true;
        return false;
    })();

    if (isPremiumGroup && !hasAccess) {
        // Redirect unauthorized users to home as requested
        redirect('/');
    }

    const subtitlesWithPermissions = ((post as any).subtitles || []).map((sub: any) => ({
        ...sub,
        canDownload: !!user
    }));

    return (
        <MoviePageContent
            initialPost={post}
            initialSubtitles={subtitlesWithPermissions}
            session={session}
        />
    );
}
