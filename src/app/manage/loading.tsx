import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 mt-2">
        <div className="flex items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="ml-auto h-9 w-[150px] rounded-md" />
        </div>
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-28 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </div>
            <div className="rounded-md border">
                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <Skeleton className="h-5 w-24" />
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <Skeleton className="h-5 w-24" />
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <Skeleton className="h-5 w-20" />
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">
                                     <Skeleton className="h-5 w-20" />
                                </th>
                                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                     <Skeleton className="h-5 w-20" />
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"></th>
                            </tr>
                        </thead>
                         <tbody className="[&_tr:last-child]:border-0">
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b transition-colors">
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-md" />
                                            <Skeleton className="h-5 w-40" />
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle"><Skeleton className="h-5 w-32" /></td>
                                    <td className="p-4 align-middle"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                    <td className="p-4 align-middle hidden md:table-cell"><Skeleton className="h-5 w-24" /></td>
                                    <td className="p-4 align-middle"><Skeleton className="h-5 w-16" /></td>
                                    <td className="p-4 align-middle"><Skeleton className="h-8 w-8" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
  )
}
