import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading state of a chart card. Also the Suspense fallback while a lazy chart chunk loads.
export function ChartSkeleton() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-52" />
        {/* Same height as the description: 1 line, 2 lines on mobile where it wraps (FE-05) */}
        <div className="flex h-5 flex-col justify-around max-sm:h-10">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="hidden h-3 w-40 max-sm:block" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
