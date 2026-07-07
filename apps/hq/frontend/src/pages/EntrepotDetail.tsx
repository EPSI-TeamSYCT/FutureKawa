import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Gauge } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'
import { getWarehouse } from '@/lib/warehouses'

export function EntrepotDetail() {
  const { id } = useParams()
  const warehouse = id ? getWarehouse(id) : undefined
  useEffect(() => {
    document.title = `FutureKawa — ${warehouse?.name ?? 'Entrepôt'}`
  }, [warehouse])

  return (
    <>
      <PageHeader
        eyebrow="Entrepôt"
        title={warehouse?.name ?? id}
        description={
          warehouse
            ? `${warehouse.city} — jauge de conditions et mesures temps réel.`
            : 'Entrepôt inconnu.'
        }
      />
      <EmptyState
        icon={<Gauge size={22} strokeWidth={1.75} />}
        title="Détail de l’entrepôt en construction"
        description="La jauge de conditions (zones verte / caramel / rouge) et les mesures live arrivent en Phase 5."
      />
    </>
  )
}
