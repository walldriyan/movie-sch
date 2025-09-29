import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/header";

export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="relative -mt-8 mb-12 flex flex-col items-center overflow-hidden rounded-3xl border md:flex-row">
           <Skeleton className="absolute inset-0 h-full w-full" />
           <div className="z-10 flex w-full flex-col p-8 md:w-1/2 md:p-12 lg:p-16 space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <div className="flex items-center space-x-6 pt-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="pt-6 flex space-x-4">
                <Skeleton className="h-12 w-36" />
                <Skeleton className="h-12 w-36" />
              </div>
           </div>
        </section>

        <div className="w-full">
            <div className="flex space-x-1 rounded-md bg-muted p-1 w-full md:w-1/2 lg:w-1/3 mb-4">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
            </div>

            <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </main>
    </div>
  )
}
