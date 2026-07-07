import { Link } from 'react-router-dom'
import { Badge, Skeleton } from '@/components/ui'
import { LiveIndicator } from './LiveIndicator'
import { Sparkline } from './Sparkline'
import { useAsync } from '@/hooks/useAsync'
import { getEntrepotMesures } from '@/api/mesures'
import type { EntrepotStatut } from '@/api/types'
import './WarehouseCard.css'

export interface WarehouseCardProps {
  entrepot: EntrepotStatut
}

export function WarehouseCard({ entrepot }: Readonly<WarehouseCardProps>) {
  const { data, loading } = useAsync(
    (signal) => getEntrepotMesures(entrepot.id, '24h', signal),
    [entrepot.id],
  )
  const temps = (data ?? []).map((m) => m.temp)
  const alert = entrepot.horsPlage

  return (
    <Link className="fk-whcard" to={`/entrepots/${entrepot.id}`}>
      <div className="fk-whcard-head">
        <div>
          <div className="fk-caption fk-whcard-eyebrow">{entrepot.ville}</div>
          <div className="fk-whcard-name">{entrepot.nom}</div>
        </div>
        <Badge tone={alert ? 'alert' : 'success'} size="sm" dot>
          {alert ? 'Hors plage' : 'Conforme'}
        </Badge>
      </div>

      <div className="fk-whcard-measure fk-mono">
        {entrepot.derniereMesure.temp}°C
        <span className="fk-whcard-sep">·</span>
        {entrepot.derniereMesure.humidity}%
      </div>

      <div className="fk-whcard-spark">
        {loading ? (
          <Skeleton height={28} />
        ) : (
          <Sparkline
            data={temps}
            width={220}
            height={28}
            color={alert ? 'var(--fk-alert)' : 'var(--fk-spark)'}
            fill
            ariaLabel={`Température sur 24 h à ${entrepot.nom}`}
          />
        )}
      </div>

      <div className="fk-whcard-foot">
        <LiveIndicator tone={alert ? 'alert' : 'success'} label="24 h" />
        <span className="fk-mono fk-whcard-lots">{entrepot.nbLots} lots</span>
      </div>
    </Link>
  )
}
