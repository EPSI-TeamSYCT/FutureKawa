import { apiGet } from './client'
import type { PaysInfo } from './types'

export function getPays(signal?: AbortSignal): Promise<PaysInfo[]> {
  return apiGet<PaysInfo[]>('/api/pays', undefined, signal)
}
