import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
        </div>
         <Skeleton className="h-px w-full mb-8" />
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
            </div>
            <Skeleton className="h-8 w-40 rounded-full" />
        </div>
        
        <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <article key={i}>
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-8 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="col-span-4">
                    <Skeleton className="aspect-video w-full rounded-md" />
                  </div>
                </div>

                 <div className="flex items-center space-x-4 mt-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
              </article>
            ))}
        </div>
      </main>
    </div>
  )
}
