import { apiGet } from './client'
import type { Mesure, Periode } from './types'

export function getLotMesures(
  lotId: string,
  periode: Periode = '30j',
  signal?: AbortSignal,
): Promise<Mesure[]> {
  return apiGet<Mesure[]>(`/api/lots/${encodeURIComponent(lotId)}/mesures`, { periode }, signal)
}

export function getEntrepotMesures(
  entrepotId: string,
  periode: Periode = '24h',
  signal?: AbortSignal,
): Promise<Mesure[]> {
  return apiGet<Mesure[]>(
    `/api/entrepots/${encodeURIComponent(entrepotId)}/mesures`,
    { periode },
    signal,
  )
}
