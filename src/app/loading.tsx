import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/header";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Loading() {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        <div className="flex">
          <div className="hidden md:block">
            <div className="w-12" />
          </div>
          <SidebarInset className="flex-1">
            <Header />
            <div className="relative -mt-16 h-[560px] w-full">
              <Skeleton className="h-full w-full" />
            </div>
            <main className="container mx-auto -mt-64 px-4 pb-8">
              <section className="relative z-10 mb-12 flex flex-col md:flex-row items-start gap-8">
                <div className="w-full md:w-[200px] flex-shrink-0 mx-auto">
                    <Skeleton className="h-[300px] w-[200px] rounded-lg" />
                    <div className="mt-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>

                <div className="w-full space-y-4">
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
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
