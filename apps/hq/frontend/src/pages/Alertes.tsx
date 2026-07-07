import { useEffect } from 'react'
import { Bell } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useCountryFilter } from '@/hooks/country-context'
import { scopeName } from '@/lib/countries'

export function Alertes() {
  const { scope } = useCountryFilter()
  useEffect(() => {
    document.title = 'FutureKawa — Alertes'
  }, [])

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Alertes"
        description="File priorisée des alertes : dérive de conditions ou lot de plus de 365 jours."
      />
      <EmptyState
        icon={<Bell size={22} strokeWidth={1.75} />}
        title="File d’alertes en construction"
        description="La file priorisée, le statut d’e-mail au responsable et le marquage traité arrivent en Phase 5."
      />
    </>
  )
}
