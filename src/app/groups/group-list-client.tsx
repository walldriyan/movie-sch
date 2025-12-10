'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import GroupCard from '@/components/group-card';
import { Search } from 'lucide-react';

interface GroupListClientProps {
    groups: any[];
}

export default function GroupListClient({ groups }: GroupListClientProps) {
    const [search, setSearch] = useState('');

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Discover Groups</h1>
                        <p className="text-muted-foreground text-lg">Join communities and explore curated collections.</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search groups..."
                            className="bg-white/5 border-white/10 rounded-full pl-10 h-11 focus-visible:ring-primary/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {filteredGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredGroups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                        <h3 className="text-xl font-bold mb-2">No groups found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
