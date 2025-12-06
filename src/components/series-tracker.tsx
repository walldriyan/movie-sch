
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, List, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Post } from '@/lib/types';
import SeriesPostCard from './series-post-card';
import type { Session } from 'next-auth';
import { cn } from '@/lib/utils';

interface SeriesTrackerProps {
  seriesId: number;
  posts: (Post & { isLocked?: boolean })[];
  currentPostId: number;
  passedExamIds: Set<number>;
  session: Session | null;
}

export default function SeriesTracker({
  seriesId,
  posts,
  currentPostId,
  passedExamIds,
  session,
}: SeriesTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedCount = posts.filter(p => p.exam && passedExamIds.has(p.exam.id)).length;
  const progressPercentage = posts.length > 0 ? (completedCount / posts.length) * 100 : 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <List className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">Episodes</h3>
            <p className="text-xs text-white/50">{completedCount} of {posts.length} completed</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
            {posts.length}
          </span>
          <div className={cn(
            "p-1.5 rounded-lg transition-colors",
            isExpanded ? "bg-white/10" : "bg-transparent hover:bg-white/5"
          )}>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )}
          </div>
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Episodes list */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
          {posts.map((post) => (
            <SeriesPostCard
              key={post.id}
              post={post}
              seriesId={seriesId}
              isActive={post.id === currentPostId}
              isLocked={post.isLocked ?? true}
              isPassed={post.exam ? passedExamIds.has(post.exam.id) : false}
              session={session}
            />
          ))}
        </div>
      )}

      {/* Quick stats footer */}
      {isExpanded && posts.length > 0 && (
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Sparkles className="w-3 h-3" />
            <span>Keep going! You're doing great.</span>
          </div>
        </div>
      )}
    </div>
  );
}
