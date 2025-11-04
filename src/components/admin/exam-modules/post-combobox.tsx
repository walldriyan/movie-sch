
'use client';

import React, { useState, useTransition, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchPostsForExam } from '@/lib/actions';
import type { Post } from '@prisma/client';

type PostWithGroup = Post & { group: { name: string } | null };

export const PostCombobox = ({
    field,
    initialPosts,
    onPostsChange,
}: {
    field: any,
    initialPosts: PostWithGroup[],
    onPostsChange: (posts: PostWithGroup[]) => void,
}) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, startSearchTransition] = useTransition();
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            if (query.length > 2) {
                startSearchTransition(async () => {
                    const fetchedPosts = await searchPostsForExam(query);
                    const allPosts = [...initialPosts, ...fetchedPosts as PostWithGroup[]];
                    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id, p])).values());
                    onPostsChange(uniquePosts);
                });
            }
        }, 300);
    }, [initialPosts, onPostsChange]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                        )}
                    >
                        {field.value
                            ? initialPosts.find(
                                (post) => String(post.id) === field.value
                            )?.title
                            : "Select a post"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput 
                        placeholder="Search posts..."
                        value={searchQuery}
                        onValueChange={handleSearch}
                    />
                    <CommandList>
                        {isSearching && <div className="p-2 text-sm text-center text-muted-foreground">Searching...</div>}
                        <CommandEmpty>No post found.</CommandEmpty>
                        <CommandGroup>
                            {initialPosts.map((post) => (
                                <CommandItem
                                    value={post.title}
                                    key={post.id}
                                    onSelect={() => {
                                        field.onChange(String(post.id));
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            String(post.id) === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {post.title}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
