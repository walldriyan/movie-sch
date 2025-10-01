import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-background">
       <main className="container mx-auto px-4 pb-8 py-8">
        <div className="mb-8">
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
            </div>
        </div>
        <div className="relative h-[500px] w-full">
            <Skeleton className="h-full w-full rounded-2xl" />
        </div>
        <div className="mt-12 max-w-4xl">
            <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </main>
    </div>
  )
}
