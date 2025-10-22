
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClientRelativeDate from '@/components/client-relative-date';
import { MessageCircle, Heart, Share2, MoreHorizontal } from 'lucide-react';
import type { MicroPost, User, MicroPostImage, Category, Tag } from '@prisma/client';

type MicroPostWithRelations = MicroPost & {
    author: User;
    images: MicroPostImage[];
    categories: Category[];
    tags: Tag[];
    _count: {
        likes: number;
        comments: number;
    };
};

interface MicroPostCardProps {
    post: MicroPostWithRelations;
}

export default function MicroPostCard({ post }: MicroPostCardProps) {
    const postImage = post.images?.[0]?.url;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Link href={`/profile/${post.author.id}`}>
                        <Avatar>
                            <AvatarImage src={post.author.image || ''} alt={post.author.name || ''} />
                            <AvatarFallback>{post.author.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                                {post.author.name}
                            </Link>
                            <span className="text-sm text-muted-foreground">·</span>
                            <ClientRelativeDate date={post.createdAt} />
                        </div>
                        <p className="text-sm text-muted-foreground">@{post.author.username || post.author.id}</p>
                        
                        <p className="mt-2 whitespace-pre-wrap">{post.content}</p>

                        {postImage && (
                             <div className="mt-3 relative aspect-video max-h-[400px] w-full overflow-hidden rounded-xl border">
                                <Image 
                                    src={postImage} 
                                    alt="Post image" 
                                    fill
                                    className="object-cover"
                                />
                             </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                            {post.categories.map(category => (
                                <Badge key={category.id} variant="secondary">{category.name}</Badge>
                            ))}
                            {post.tags.map(tag => (
                                <Badge key={tag.id} variant="outline">#{tag.name}</Badge>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-between items-center text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MessageCircle className="h-4 w-4" />
                                </Button>
                                <span className="text-xs">{post._count.comments}</span>
                            </div>
                             <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Heart className="h-4 w-4" />
                                </Button>
                                <span className="text-xs">{post._count.likes}</span>
                            </div>
                             <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
