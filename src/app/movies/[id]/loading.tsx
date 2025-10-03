import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-transparent">
       <main className="max-w-6xl mx-auto pb-8 px-4 md:px-8">
        <div className="relative h-[500px] w-full rounded-b-2xl overflow-hidden flex items-end">
            <Skeleton className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
            
            <Skeleton className="absolute top-4 left-4 z-10 h-10 w-10 rounded-full" />

            <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2 justify-end">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-start text-left pb-0 w-full pr-8">
                <Skeleton className="h-12 w-3/4 mb-4" />
                
                <div className="flex items-center space-x-4 mt-2.5">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>

                <Skeleton className="h-px w-full my-4" />
                <div className="flex items-center justify-between py-2 w-full">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-28" />
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-6 w-px mx-2" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-12 px-4 md:px-0">
            <div className="md:col-span-3 space-y-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />

                <Skeleton className="h-px w-full my-12" />
                
                <div className="space-y-8">
                    <Skeleton className="h-8 w-48 mb-8" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </div>
            <aside className="md:col-span-1">
                <Skeleton className="h-96 w-full rounded-lg" />
            </aside>
        </div>
      </main>
    </div>
  )
}
