import { useCallback, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isCountryScope, type CountryScope } from '@/lib/countries'
import { CountryFilterContext } from './country-context'

/** Holds the active country scope in the URL (?pays=br|ec|co, absent = Siège). */
export function CountryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [params, setParams] = useSearchParams()
  const raw = params.get('pays')
  const scope: CountryScope = isCountryScope(raw) ? raw : 'siege'

  const setScope = useCallback(
    (next: CountryScope) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (next === 'siege') p.delete('pays')
          else p.set('pays', next)
          return p
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const value = useMemo(() => ({ scope, setScope }), [scope, setScope])

  return <CountryFilterContext.Provider value={value}>{children}</CountryFilterContext.Provider>
}
