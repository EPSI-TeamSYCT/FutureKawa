import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RotateCcw, Search } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui'
import { LotStatusBadge } from '@/components/metier'
import { useCountryFilter } from '@/hooks/country-context'
import { useAsync } from '@/hooks/useAsync'
import { getLots } from '@/api/lots'
import { ageTone } from '@/lib/conditions'
import { getCountry, scopeName } from '@/lib/countries'
import { WAREHOUSES, warehousesByCountry } from '@/lib/warehouses'
import type { Lot, LotStatut } from '@/api/types'
import './Lots.css'

type SortKey = 'id' | 'entrepotNom' | 'dateEntree' | 'ageJours' | 'statut'
const STATUTS: LotStatut[] = ['CONFORME', 'EN_ALERTE', 'PERIME', 'EXPEDIE']
const ROW_SKELETONS = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']

export function Lots() {
  const { scope } = useCountryFilter()
  const navigate = useNavigate()
  const [entrepot, setEntrepot] = useState('')
  const [statut, setStatut] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'dateEntree',
    dir: 'asc',
  })

  useEffect(() => {
    document.title = 'FutureKawa — Lots'
  }, [])

  // Reset the warehouse filter when the country scope changes.
  useEffect(() => {
    setEntrepot('')
  }, [scope])

  const { data, loading, error, refetch } = useAsync(
    (signal) =>
      getLots(
        {
          scope,
          entrepot: entrepot || undefined,
          statut: (statut || undefined) as LotStatut | undefined,
        },
        signal,
      ),
    [scope, entrepot, statut],
  )

  const warehouseOptions = scope === 'siege' ? WAREHOUSES : warehousesByCountry(scope)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = (data ?? []).filter((l) => (q ? l.id.toLowerCase().includes(q) : true))
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return cmp * dir
    })
  }, [data, query, sort])

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }
  const sortDir = (key: SortKey) => (sort.key === key ? sort.dir : null)

  const hasFilters = Boolean(entrepot || statut || query)

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Lots"
        description="Table FIFO du café vert stocké — les lots les plus anciens en premier."
        actions={
          !loading && data ? (
            <span className="fk-mono lots-count">{rows.length} lots</span>
          ) : undefined
        }
      />

      <div className="lots-filters">
        <Input
          className="lots-search"
          placeholder="Rechercher un ID de lot…"
          leadingIcon={<Search size={16} strokeWidth={1.75} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          mono
          aria-label="Rechercher un lot par identifiant"
        />
        <Select
          aria-label="Filtrer par entrepôt"
          value={entrepot}
          onChange={(e) => setEntrepot(e.target.value)}
        >
          <option value="">Tous les entrepôts</option>
          {warehouseOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={15} strokeWidth={1.75} />}
            onClick={() => {
              setEntrepot('')
              setStatut('')
              setQuery('')
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {error ? (
        <EmptyState
          title="Impossible de charger les lots"
          description={error.message}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Réessayer
            </Button>
          }
        />
      ) : (
        <Card flush>
          <Table stickyHeader maxHeight="calc(100vh - 320px)">
            <THead>
              <Tr>
                <Th sortable sortDirection={sortDir('id')} onClick={() => toggleSort('id')}>
                  ID lot
                </Th>
                <Th>Pays</Th>
                <Th
                  sortable
                  sortDirection={sortDir('entrepotNom')}
                  onClick={() => toggleSort('entrepotNom')}
                >
                  Entrepôt
                </Th>
                <Th
                  sortable
                  sortDirection={sortDir('dateEntree')}
                  onClick={() => toggleSort('dateEntree')}
                >
                  Entrée
                </Th>
                <Th
                  align="right"
                  sortable
                  sortDirection={sortDir('ageJours')}
                  onClick={() => toggleSort('ageJours')}
                >
                  Âge
                </Th>
                <Th sortable sortDirection={sortDir('statut')} onClick={() => toggleSort('statut')}>
                  Statut
                </Th>
                <Th align="right">Conditions</Th>
              </Tr>
            </THead>
            <TBody>
              {loading
                ? ROW_SKELETONS.map((id) => <LotRowSkeleton key={id} />)
                : rows.map((lot) => (
                    <LotRow key={lot.id} lot={lot} onOpen={() => navigate(`/lots/${lot.id}`)} />
                  ))}
            </TBody>
          </Table>
          {!loading && rows.length === 0 && (
            <EmptyState
              className="lots-empty"
              title="Aucun lot ne correspond"
              description="Ajuste les filtres ou la recherche pour voir des lots."
            />
          )}
        </Card>
      )}
    </>
  )
}

function LotRow({ lot, onOpen }: Readonly<{ lot: Lot; onOpen: () => void }>) {
  return (
    <Tr
      muted={lot.statut === 'EXPEDIE'}
      onClick={onOpen}
      style={{ cursor: 'pointer' }}
      aria-label={`Ouvrir le lot ${lot.id}`}
    >
      <Td mono>
        <Link className="lots-id-link" to={`/lots/${lot.id}`} onClick={(e) => e.stopPropagation()}>
          {lot.id}
        </Link>
      </Td>
      <Td>{getCountry(lot.pays).name}</Td>
      <Td>{lot.entrepotNom}</Td>
      <Td mono>{lot.dateEntree}</Td>
      <Td align="right">
        <Badge tone={ageTone(lot.ageJours)} size="sm" dot>
          {lot.ageJours} j
        </Badge>
      </Td>
      <Td>
        <LotStatusBadge statut={lot.statut} size="sm" />
      </Td>
      <Td align="right" mono>
        {lot.conditions ? `${lot.conditions.temp}°C · ${lot.conditions.humidity}%` : '—'}
      </Td>
    </Tr>
  )
}

function LotRowSkeleton() {
  return (
    <Tr>
      <Td mono>
        <Skeleton variant="text" width={140} />
      </Td>
      <Td>
        <Skeleton variant="text" width={60} />
      </Td>
      <Td>
        <Skeleton variant="text" width={90} />
      </Td>
      <Td mono>
        <Skeleton variant="text" width={80} />
      </Td>
      <Td align="right">
        <Skeleton variant="text" width={48} style={{ marginLeft: 'auto' }} />
      </Td>
      <Td>
        <Skeleton variant="text" width={96} />
      </Td>
      <Td align="right">
        <Skeleton variant="text" width={90} style={{ marginLeft: 'auto' }} />
      </Td>
    </Tr>
  )
}
