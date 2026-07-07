import { useEffect, useRef, useState, type DependencyList } from 'react'
import { useAsync, type AsyncState } from './useAsync'

export interface PollingState<T> extends AsyncState<T> {
  lastUpdated: number | undefined
}

/**
 * Like useAsync but re-fetches on an interval (e.g. live warehouse measures).
 * Pauses when the tab is hidden and respects `enabled`.
 */
export function usePolling<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
  intervalMs: number,
  enabled = true,
): PollingState<T> {
  const state = useAsync(factory, deps)
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined)
  const refetchRef = useRef(state.refetch)
  refetchRef.current = state.refetch

  useEffect(() => {
    if (state.data !== undefined && !state.loading) setLastUpdated(Date.now())
  }, [state.data, state.loading])

  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      if (!document.hidden) refetchRef.current()
    }
    const timer = setInterval(tick, intervalMs)
    return () => clearInterval(timer)
  }, [enabled, intervalMs])

  return { ...state, lastUpdated }
}
