
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
  posts: Post[];
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

  // Create a map for quick lookup of which exams have been passed.
  const passedExamsByPostId = new Map<number, boolean>();
  posts.forEach(post => {
    if (post.exam) {
      passedExamsByPostId.set(post.id, passedExamIds.has(post.exam.id));
    }
  });

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
            {posts.map((post, index) => {
               // Determine if the prerequisite for the current post is met.
               const previousPost = index > 0 ? posts[index - 1] : null;
               
               // The current step is considered "passed" if:
               // 1. It's the first post (no previous post).
               // 2. The previous post doesn't require an exam to unlock the next one.
               // 3. The previous post does not have an exam associated with it.
               // 4. The user has passed the exam of the previous post.
               const isPassed = !previousPost || !previousPost.requiresExamToUnlock || !previousPost.exam || passedExamIds.has(previousPost.exam.id);

              return (
                <SeriesPostCard
                  key={post.id}
                  post={post}
                  seriesId={seriesId}
                  isActive={post.id === currentPostId}
                  isPassed={isPassed}
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
