import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui'
import type { TempHumidityChartProps } from './TempHumidityChart'

// Chart.js is heavy — load it (and its setup) only when a chart is actually shown.
const Chart = lazy(() =>
  import('./TempHumidityChart').then((m) => ({ default: m.TempHumidityChart })),
)

export function LazyTempHumidityChart(props: Readonly<TempHumidityChartProps>) {
  return (
    <Suspense fallback={<Skeleton height={props.height ?? 340} />}>
      <Chart {...props} />
    </Suspense>
  )
}
