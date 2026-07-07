import { useCountryFilter } from '@/hooks/country-context'
import { SCOPES } from '@/lib/countries'
import './CountrySelector.css'

/** Global segmented control in the topbar: Siège · Brésil · Équateur · Colombie. */
export function CountrySelector() {
  const { scope, setScope } = useCountryFilter()
  return (
    <fieldset className="fk-country" aria-label="Filtrer par pays">
      {SCOPES.map((s) => {
        const active = scope === s.code
        return (
          <button
            key={s.code}
            type="button"
            className={`fk-country-opt ${active ? 'is-active' : ''}`.trim()}
            aria-pressed={active}
            onClick={() => setScope(s.code)}
          >
            {s.name}
          </button>
        )
      })}
    </fieldset>
  )
}
