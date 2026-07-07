import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { LineChart } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'

export function LotDetail() {
  const { id } = useParams()
  useEffect(() => {
    document.title = `FutureKawa — Lot ${id ?? ''}`.trim()
  }, [id])

  return (
    <>
      <PageHeader
        eyebrow="Lot"
        title={<span className="fk-mono">{id}</span>}
        description="Fiche du lot, timeline et courbes température / humidité depuis l’entrée en stockage."
      />
      <EmptyState
        icon={<LineChart size={22} strokeWidth={1.75} />}
        title="Détail du lot en construction"
        description="La fiche, la timeline et le TempHumidityChart (bande de tolérance, points hors-plage) arrivent en Phase 5."
      />
    </>
  )
}
