import { Check, Clock, TriangleAlert, Truck } from 'lucide-react'
import { Badge, type BadgeSize, type BadgeTone } from '@/components/ui'
import type { LotStatut } from '@/api/types'

interface StatusConfig {
  tone: BadgeTone
  label: string
  icon: typeof Check
}

const CONFIG: Record<LotStatut, StatusConfig> = {
  CONFORME: { tone: 'success', label: 'CONFORME', icon: Check },
  EN_ALERTE: { tone: 'alert', label: 'EN ALERTE', icon: TriangleAlert },
  PERIME: { tone: 'danger', label: 'PÉRIMÉ', icon: Clock },
  EXPEDIE: { tone: 'neutral', label: 'EXPÉDIÉ', icon: Truck },
}

export interface LotStatusBadgeProps {
  statut: LotStatut
  size?: BadgeSize
}

/** Lot status as colour + icon + label — never colour alone. */
export function LotStatusBadge({ statut, size = 'md' }: LotStatusBadgeProps) {
  const { tone, label, icon: Icon } = CONFIG[statut]
  return (
    <Badge
      tone={tone}
      size={size}
      icon={<Icon size={size === 'sm' ? 13 : 14} strokeWidth={1.75} />}
    >
      {label}
    </Badge>
  )
}
