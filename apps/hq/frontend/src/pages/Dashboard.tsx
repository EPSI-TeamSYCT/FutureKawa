import { useEffect } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { useCountryFilter } from '@/hooks/country-context'
import { scopeName } from '@/lib/countries'

export function Dashboard() {
  const { scope } = useCountryFilter()
  useEffect(() => {
    document.title = 'FutureKawa — Dashboard'
  }, [])

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Dashboard"
        description="Vue consolidée : KPI des lots, cartes d’entrepôts en temps réel et dernières alertes."
      />
      <EmptyState
        icon={<LayoutDashboard size={22} strokeWidth={1.75} />}
        title="Vue siège en construction"
        description="Les KPI, la grille d’entrepôts et la file d’alertes arrivent en Phase 5, sur les données mockées."
      />
    </>
  )
}
