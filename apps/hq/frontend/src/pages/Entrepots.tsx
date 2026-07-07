import { useEffect } from 'react'
import { Warehouse } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useCountryFilter } from '@/hooks/country-context'
import { scopeName } from '@/lib/countries'

export function Entrepots() {
  const { scope } = useCountryFilter()
  useEffect(() => {
    document.title = 'FutureKawa — Entrepôts'
  }, [])

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Entrepôts"
        description="Entrepôts par pays, avec dernière mesure, statut global et conditions temps réel."
      />
      <EmptyState
        icon={<Warehouse size={22} strokeWidth={1.75} />}
        title="Liste des entrepôts en construction"
        description="Les cartes d’entrepôts, la jauge de conditions et le suivi live (polling 30 s) arrivent en Phase 5."
      />
    </>
  )
}
