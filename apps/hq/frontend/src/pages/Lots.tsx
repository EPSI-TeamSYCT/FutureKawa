import { useEffect } from 'react'
import { Boxes } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useCountryFilter } from '@/hooks/country-context'
import { scopeName } from '@/lib/countries'

export function Lots() {
  const { scope } = useCountryFilter()
  useEffect(() => {
    document.title = 'FutureKawa — Lots'
  }, [])

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Lots"
        description="Table FIFO des lots de café vert, du plus ancien au plus récent, avec filtres et recherche."
      />
      <EmptyState
        icon={<Boxes size={22} strokeWidth={1.75} />}
        title="Table des lots en construction"
        description="La table FIFO triée, ses filtres (pays, entrepôt, statut) et la recherche arrivent en Phase 5."
      />
    </>
  )
}
