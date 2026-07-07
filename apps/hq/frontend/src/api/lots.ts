import { apiGet } from './client'
import type { CountryScope } from '@/lib/countries'
import type { Lot, LotStatut } from './types'

export interface LotFilters {
  scope?: CountryScope
  entrepot?: string
  statut?: LotStatut
}

function paysParam(scope?: CountryScope): string | undefined {
  return scope && scope !== 'siege' ? scope : undefined
}

/** Lots sorted FIFO (oldest first) by the API. */
export function getLots(filters: LotFilters = {}, signal?: AbortSignal): Promise<Lot[]> {
  return apiGet<Lot[]>(
    '/api/lots',
    { pays: paysParam(filters.scope), entrepot: filters.entrepot, statut: filters.statut },
    signal,
  )
}

export function getLot(id: string, signal?: AbortSignal): Promise<Lot> {
  return apiGet<Lot>(`/api/lots/${encodeURIComponent(id)}`, undefined, signal)
}
