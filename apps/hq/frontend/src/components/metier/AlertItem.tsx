import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Mail, MailCheck, MailWarning } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { relativeTime } from '@/lib/format'
import { getCountry } from '@/lib/countries'
import type { Alerte, EmailStatut } from '@/api/types'
import './AlertItem.css'

const EMAIL: Record<EmailStatut, { label: string; icon: typeof Mail; cls: string }> = {
  ENVOYE: { label: 'E-mail envoyé', icon: MailCheck, cls: 'ok' },
  EN_ATTENTE: { label: 'E-mail en attente', icon: Mail, cls: 'wait' },
  ECHEC: { label: 'Échec e-mail', icon: MailWarning, cls: 'fail' },
}

export interface AlertItemProps {
  alerte: Alerte
  onTraiter: (id: string) => void
  treating?: boolean
}

export function AlertItem({ alerte, onTraiter, treating = false }: Readonly<AlertItemProps>) {
  const drift = alerte.type === 'DERIVE'
  const email = EMAIL[alerte.emailStatut]
  const EmailIcon = email.icon
  const target = alerte.lotId ? `/lots/${alerte.lotId}` : `/entrepots/${alerte.entrepotId}`

  return (
    <article className={`fk-alert ${alerte.traitee ? 'is-done' : ''}`.trim()}>
      <div className="fk-alert-main">
        <div className="fk-alert-top">
          <Badge tone={drift ? 'alert' : 'danger'} size="sm" dot>
            {drift ? 'Dérive' : 'Péremption'}
          </Badge>
          <span className="fk-alert-country fk-mono">{getCountry(alerte.pays).name}</span>
          <span className="fk-alert-dot" aria-hidden="true">
            ·
          </span>
          <span className="fk-alert-time fk-mono">{relativeTime(alerte.timestamp)}</span>
        </div>
        <p className="fk-alert-msg">{alerte.message}</p>
        <div className="fk-alert-meta">
          <span className={`fk-alert-email email-${email.cls}`}>
            <EmailIcon size={13} strokeWidth={1.75} aria-hidden="true" />
            {email.label}
          </span>
          <Link className="fk-alert-open" to={target}>
            {alerte.lotId ? 'Voir le lot' : "Voir l'entrepôt"}
            <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="fk-alert-action">
        {alerte.traitee ? (
          <Badge tone="success" size="sm" icon={<Check size={13} strokeWidth={1.75} />}>
            Traité
          </Badge>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={treating}
            onClick={() => onTraiter(alerte.id)}
          >
            Marquer traité
          </Button>
        )}
      </div>
    </article>
  )
}
