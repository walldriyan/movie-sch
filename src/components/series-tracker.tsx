
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Post } from '@/lib/types';
import SeriesPostCard from './series-post-card';

interface SeriesTrackerProps {
  seriesId: number;
  posts: Post[];
  currentPostId: number;
}

export default function SeriesTracker({
  seriesId,
  posts,
  currentPostId,
}: SeriesTrackerProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1" className="border-b-0">
        <AccordionTrigger className="text-base font-semibold hover:no-underline">
          Episodes ({posts.length})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {posts.map((post) => (
              <SeriesPostCard
                key={post.id}
                post={post}
                seriesId={seriesId}
                isActive={post.id === currentPostId}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
