import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Sparkline } from './Sparkline'
import './KpiCard.css'

export interface KpiCardProps {
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  /** Signed delta vs the previous period. */
  delta?: number
  deltaSuffix?: string
  /** Whether a positive delta is good (green) or bad (caramel). */
  positiveIsGood?: boolean
  trend?: number[]
  trendColor?: string
}

export function KpiCard({
  label,
  value,
  unit,
  icon,
  delta,
  deltaSuffix = '',
  positiveIsGood = true,
  trend,
  trendColor,
}: KpiCardProps) {
  const up = (delta ?? 0) >= 0
  const good = delta === undefined ? true : up === positiveIsGood
  const DeltaIcon = up ? TrendingUp : TrendingDown

  return (
    <div className="fk-kpi">
      <div className="fk-kpi-head">
        <span className="fk-kpi-label fk-mono">{label}</span>
        {icon && (
          <span className="fk-kpi-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="fk-kpi-value fk-mono">
        {value}
        {unit && <span className="fk-kpi-unit">{unit}</span>}
      </div>
      <div className="fk-kpi-foot">
        {delta !== undefined && (
          <span className={`fk-kpi-delta ${good ? 'is-good' : 'is-bad'}`}>
            <DeltaIcon size={14} strokeWidth={1.75} aria-hidden="true" />
            <span className="fk-mono">
              {up ? '+' : ''}
              {delta}
              {deltaSuffix}
            </span>
          </span>
        )}
        {trend && trend.length > 1 && (
          <Sparkline data={trend} width={96} height={28} color={trendColor} fill />
        )}
      </div>
    </div>
  )
}
