import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">Manage Movies</h1>
            <Skeleton className="ml-auto h-9 w-[150px] rounded-full" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
  )
}
