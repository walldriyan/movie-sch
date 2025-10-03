import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 md:auto-rows-[152px] gap-4">
          <Skeleton className="md:col-span-2 md:row-span-2 rounded-xl" />
          <Skeleton className="rounded-xl" />
          <Skeleton className="md:row-span-2 rounded-xl" />
          <Skeleton className="rounded-xl" />
          <Skeleton className="md:col-span-2 rounded-xl" />
        </div>

        <Skeleton className="h-px w-full my-12 bg-gray-800" />

        <div className="mb-8 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center group">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className='text-center mt-2 space-y-2'>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
