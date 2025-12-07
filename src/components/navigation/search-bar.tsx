'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Film, Tv, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SearchResult {
    id: string;
    title: string;
    type: 'MOVIE' | 'TV_SERIES';
    posterUrl?: string;
    author?: { name: string };
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const searchPosts = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/posts/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.posts || []);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchPosts(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchPosts]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsOpen(true);
    };

    const handleResultClick = () => {
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search movies, series..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    className="w-[280px] pl-9 pr-8 h-9 bg-secondary/50 text-sm focus-visible:bg-secondary transition-colors"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (query.length >= 2 || results.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result) => (
                                <Link
                                    key={result.id}
                                    href={`/movies/${result.id}`}
                                    onClick={handleResultClick}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-secondary transition-colors"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-10 h-14 rounded bg-muted overflow-hidden flex-shrink-0">
                                        {result.posterUrl ? (
                                            <Image
                                                src={result.posterUrl}
                                                alt={result.title}
                                                width={40}
                                                height={56}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {result.type === 'MOVIE' ? (
                                                    <Film className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <Tv className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-foreground truncate">
                                            {result.title}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {result.type === 'MOVIE' ? (
                                                <><Film className="w-3 h-3" /> Movie</>
                                            ) : (
                                                <><Tv className="w-3 h-3" /> Series</>
                                            )}
                                            {result.author?.name && (
                                                <span className="truncate">• {result.author.name}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            No results found for "{query}"
                        </div>
                    ) : null}

                    {/* View all link */}
                    {results.length > 0 && (
                        <Link
                            href={`/search?q=${encodeURIComponent(query)}`}
                            onClick={handleResultClick}
                            className="block text-center py-3 text-sm text-primary hover:bg-secondary border-t border-border"
                        >
                            View all results
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
