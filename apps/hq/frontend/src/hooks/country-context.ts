import { createContext, useContext } from 'react'
import type { CountryScope } from '@/lib/countries'

export interface CountryFilterValue {
  scope: CountryScope
  setScope: (scope: CountryScope) => void
}

export const CountryFilterContext = createContext<CountryFilterValue | null>(null)

/** Global country scope (Brésil / Équateur / Colombie / Siège), synced to the URL. */
export function useCountryFilter(): CountryFilterValue {
  const ctx = useContext(CountryFilterContext)
  if (!ctx) throw new Error('useCountryFilter must be used within a CountryProvider')
  return ctx
}
