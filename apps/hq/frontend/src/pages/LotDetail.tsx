import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Skeleton,
} from '@/components/ui'
import { LotStatusBadge, LotTimeline, TempHumidityChart, type TimelineStep } from '@/components/metier'
import { useAsync } from '@/hooks/useAsync'
import { getLot } from '@/api/lots'
import { getLotMesures } from '@/api/mesures'
import { ageTone, ALERTE_AGE_DAYS, PERIME_DAYS } from '@/lib/conditions'
import { getCountry } from '@/lib/countries'
import type { Lot, Periode } from '@/api/types'
import './LotDetail.css'

const PERIODS: Periode[] = ['24h', '7j', '30j', 'tout']

function buildSteps(lot: Lot): TimelineStep[] {
  const steps: TimelineStep[] = [
    { label: 'Entrée en stockage', sublabel: lot.dateEntree, state: 'done' },
  ]
  if (lot.ageJours >= ALERTE_AGE_DAYS) {
    steps.push({
      label: lot.ageJours >= PERIME_DAYS ? 'Seuil de péremption (550 j)' : 'Seuil d’âge (365 j)',
      sublabel: `${lot.ageJours} j`,
      state: 'alert',
    })
  }
  const final: Record<Lot['statut'], TimelineStep> = {
    CONFORME: { label: 'Sous surveillance', sublabel: 'aujourd’hui', state: 'pending' },
    EN_ALERTE: { label: 'En alerte', sublabel: 'aujourd’hui', state: 'alert' },
    PERIME: { label: 'Périmé', sublabel: 'aujourd’hui', state: 'alert' },
    EXPEDIE: { label: 'Expédié', sublabel: 'sorti du stock', state: 'done' },
  }
  steps.push(final[lot.statut])
  return steps
}

export function LotDetail() {
  const { id = '' } = useParams()
  const [periode, setPeriode] = useState<Periode>('30j')

  const lotQ = useAsync((signal) => getLot(id, signal), [id])
  const mesuresQ = useAsync((signal) => getLotMesures(id, periode, signal), [id, periode])

  useEffect(() => {
    document.title = `FutureKawa — Lot ${id}`
  }, [id])

  if (lotQ.error) {
    return (
      <>
        <PageHeader eyebrow="Lot" title={<span className="fk-mono">{id}</span>} />
        <EmptyState
          title="Lot introuvable"
          description={lotQ.error.message}
          action={
            <Link to="/lots">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={15} strokeWidth={1.75} />}>
                Retour aux lots
              </Button>
            </Link>
          }
        />
      </>
    )
  }

  const lot = lotQ.data
  const country = lot ? getCountry(lot.pays) : undefined

  return (
    <>
      <PageHeader
        eyebrow="Lot"
        title={<span className="fk-mono">{id}</span>}
        description={
          <Link className="lotd-back" to="/lots">
            <ArrowLeft size={13} strokeWidth={1.75} aria-hidden="true" /> Retour aux lots
          </Link>
        }
        actions={lot ? <LotStatusBadge statut={lot.statut} /> : undefined}
      />

      {/* Fiche */}
      <Card className="lotd-fiche">
        {lotQ.loading || !lot ? (
          <div className="lotd-meta">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="lotd-meta-item" key={i}>
                <Skeleton variant="text" width={70} />
                <Skeleton variant="text" width={90} />
              </div>
            ))}
          </div>
        ) : (
          <div className="lotd-meta">
            <Meta label="Pays" value={getCountry(lot.pays).name} />
            <Meta label="Entrepôt" value={lot.entrepotNom} />
            <Meta label="Date d’entrée" value={lot.dateEntree} mono />
            <Meta
              label="Âge"
              value={
                <Badge tone={ageTone(lot.ageJours)} size="sm" dot>
                  {lot.ageJours} j
                </Badge>
              }
            />
            <Meta
              label="Conditions"
              value={lot.conditions ? `${lot.conditions.temp}°C · ${lot.conditions.humidity}%` : '—'}
              mono
            />
          </div>
        )}
      </Card>

      {/* Timeline */}
      {lot && (
        <Card className="lotd-timeline">
          <CardHeader>
            <CardTitle eyebrow="Parcours">Timeline du lot</CardTitle>
          </CardHeader>
          <LotTimeline steps={buildSteps(lot)} />
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle
            eyebrow="Conditions de stockage"
            action={
              <div className="lotd-periods" role="group" aria-label="Période">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`lotd-period ${periode === p ? 'is-active' : ''}`.trim()}
                    aria-pressed={periode === p}
                    onClick={() => setPeriode(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            }
          >
            Température &amp; humidité
          </CardTitle>
        </CardHeader>
        {mesuresQ.loading || !country ? (
          <Skeleton height={340} />
        ) : mesuresQ.error ? (
          <EmptyState
            title="Mesures indisponibles"
            description={mesuresQ.error.message}
            action={
              <Button variant="secondary" size="sm" onClick={mesuresQ.refetch}>
                Réessayer
              </Button>
            }
          />
        ) : (
          <TempHumidityChart mesures={mesuresQ.data ?? []} country={country} />
        )}
      </Card>
    </>
  )
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="lotd-meta-item">
      <span className="fk-caption">{label}</span>
      <span className={`lotd-meta-value ${mono ? 'fk-mono' : ''}`.trim()}>{value}</span>
    </div>
  )
}
