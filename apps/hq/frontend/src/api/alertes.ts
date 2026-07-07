import { apiGet, apiPost } from './client'
import type { CountryScope } from '@/lib/countries'
import type { Alerte } from './types'

export interface AlerteFilters {
  scope?: CountryScope
  traitee?: boolean
}

export function getAlertes(filters: AlerteFilters = {}, signal?: AbortSignal): Promise<Alerte[]> {
  const pays = filters.scope && filters.scope !== 'siege' ? filters.scope : undefined
  return apiGet<Alerte[]>('/api/alertes', { pays, traitee: filters.traitee }, signal)
}

export function traiterAlerte(id: string): Promise<Alerte> {
  return apiPost<Alerte>(`/api/alertes/${encodeURIComponent(id)}/traiter`)
}
