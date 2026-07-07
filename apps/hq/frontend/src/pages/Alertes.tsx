import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BellOff } from 'lucide-react'
import { Button, EmptyState, PageHeader, Skeleton, useToast } from '@/components/ui'
import { AlertItem } from '@/components/metier'
import { useCountryFilter } from '@/hooks/country-context'
import { useAsync } from '@/hooks/useAsync'
import { getAlertes, traiterAlerte } from '@/api/alertes'
import { scopeName } from '@/lib/countries'
import type { Alerte } from '@/api/types'
import './Alertes.css'

type FilterMode = 'all' | 'todo' | 'done'
const FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'todo', label: 'À traiter' },
  { id: 'done', label: 'Traitées' },
]
const SKELETON_ROWS = ['s0', 's1', 's2', 's3']

export function Alertes() {
  const { scope } = useCountryFilter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<FilterMode>('all')
  const [items, setItems] = useState<Alerte[]>([])
  const [treatingId, setTreatingId] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'FutureKawa — Alertes'
  }, [])

  const { data, loading, error, refetch } = useAsync((s) => getAlertes({ scope }, s), [scope])

  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  async function handleTraiter(id: string) {
    setTreatingId(id)
    const snapshot = items
    setItems((list) => list.map((a) => (a.id === id ? { ...a, traitee: true } : a)))
    try {
      await traiterAlerte(id)
      toast({ variant: 'success', title: 'Alerte traitée', description: id })
    } catch {
      setItems(snapshot)
      toast({ variant: 'error', title: 'Échec du traitement', description: `${id} · réessayez` })
    } finally {
      setTreatingId(null)
    }
  }

  const counts = useMemo(
    () => ({
      all: items.length,
      todo: items.filter((a) => !a.traitee).length,
      done: items.filter((a) => a.traitee).length,
    }),
    [items],
  )

  const visible = items.filter((a) => {
    if (filter === 'todo') return !a.traitee
    if (filter === 'done') return a.traitee
    return true
  })

  let content: ReactNode
  if (error) {
    content = (
      <EmptyState
        title="Impossible de charger les alertes"
        description={error.message}
        action={
          <Button variant="secondary" size="sm" onClick={refetch}>
            Réessayer
          </Button>
        }
      />
    )
  } else if (loading) {
    content = (
      <div className="alr-list">
        {SKELETON_ROWS.map((id) => (
          <Skeleton key={id} height={92} radius="var(--fk-radius-card)" />
        ))}
      </div>
    )
  } else if (visible.length === 0) {
    content = (
      <EmptyState
        icon={<BellOff size={22} strokeWidth={1.75} />}
        title={filter === 'todo' ? 'Aucune alerte à traiter' : 'Aucune alerte'}
        description="Les conditions et les âges sont dans les seuils pour ce périmètre."
      />
    )
  } else {
    content = (
      <div className="alr-list">
        {visible.map((a) => (
          <AlertItem
            key={a.id}
            alerte={a}
            treating={treatingId === a.id}
            onTraiter={handleTraiter}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Alertes"
        description="File priorisée : dérive de conditions ou lot de plus de 365 jours."
        actions={
          <fieldset className="alr-filter" aria-label="Filtrer les alertes">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`alr-filter-opt ${filter === f.id ? 'is-active' : ''}`.trim()}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className="alr-filter-count fk-mono">{counts[f.id]}</span>
              </button>
            ))}
          </fieldset>
        }
      />

      {content}
    </>
  )
}
