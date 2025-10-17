
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Post } from '@/lib/types';
import SeriesPostCard from './series-post-card';
import type { Session } from 'next-auth';

interface SeriesTrackerProps {
  seriesId: number;
  posts: (Post & { isLocked?: boolean })[]; // Expect isLocked from server
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

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1" className="border-b-0">
        <AccordionTrigger className="text-base font-semibold hover:no-underline flex justify-between p-2 rounded-lg hover:bg-muted/50">
          <div className="flex gap-2 flex-row items-center">
            <span>Episodes</span>
          </div>
          <span className="rounded-2xl p-[3px] px-3 bg-gray-900">{posts.length}</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {posts.map((post) => {
              return (
                <SeriesPostCard
                  key={post.id}
                  post={post}
                  seriesId={seriesId}
                  isActive={post.id === currentPostId}
                  isLocked={post.isLocked ?? true} // Default to locked if not provided
                  session={session}
                />
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
