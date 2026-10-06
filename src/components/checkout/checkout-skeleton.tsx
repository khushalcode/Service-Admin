import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors CheckoutViewForCart's structure: mobile header bar + stacked
 * full-width blocks; desktop 12-col grid (8-col content + 4-col sidebar). */
export function CheckoutSkeleton() {
  return (
    <>
      <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-primary p-4 lg:hidden">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col items-start gap-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-full" />
      </div>

      <div className="flex w-full justify-center bg-bg-secondary pb-28 lg:py-16">
        <div className="flex w-full flex-col items-start gap-6 px-4 lg:container lg:grid lg:grid-cols-12 lg:items-start lg:px-0">
          <div className="flex w-full flex-col items-start gap-6 lg:col-span-8">
            <Skeleton className="h-40 w-full rounded-2xl bg-bg-tertiary" />
            <Skeleton className="h-64 w-full rounded-2xl bg-bg-tertiary" />
            <Skeleton className="h-48 w-full rounded-2xl bg-bg-tertiary" />
          </div>
          <Skeleton className="h-96 w-full shrink-0 rounded-2xl bg-bg-tertiary lg:col-span-4" />
        </div>
      </div>
    </>
  );
}
