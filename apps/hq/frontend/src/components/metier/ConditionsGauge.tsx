import { isOutOfRange } from '@/lib/conditions'
import './ConditionsGauge.css'

export interface ConditionsGaugeProps {
  label: string
  value: number
  ideal: number
  tolerance: number
  unit: string
}

/*
 * Horizontal 5-zone gauge: danger · warn · ideal · warn · danger.
 * The ideal zone (36% width) spans ideal ± tolerance, so the whole bar
 * represents ideal ± ~2.78·tolerance. A marker shows the current value.
 */
const HALF_SPAN_FACTOR = 100 / 36 / 2 // ≈ 1.389 → per-side span in tolerances

export function ConditionsGauge({
  label,
  value,
  ideal,
  tolerance,
  unit,
}: Readonly<ConditionsGaugeProps>) {
  const span = tolerance * 2 * HALF_SPAN_FACTOR
  const min = ideal - span
  const max = ideal + span
  const pos = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const out = isOutOfRange(value, ideal, tolerance)

  return (
    <div className="fk-gauge">
      <div className="fk-gauge-top">
        <span className="fk-caption">{label}</span>
        <span className={`fk-gauge-value fk-mono ${out ? 'is-out' : 'is-in'}`}>
          {value}
          {unit}
        </span>
      </div>
      <div
        className="fk-gauge-track"
        role="img"
        aria-label={`${label} : ${value}${unit}, idéal ${ideal}±${tolerance}${unit}`}
      >
        <span className="fk-gauge-seg seg-danger" style={{ width: '20%' }} />
        <span className="fk-gauge-seg seg-warn" style={{ width: '12%' }} />
        <span className="fk-gauge-seg seg-ideal" style={{ width: '36%' }} />
        <span className="fk-gauge-seg seg-warn" style={{ width: '12%' }} />
        <span className="fk-gauge-seg seg-danger" style={{ width: '20%' }} />
        <span
          className={`fk-gauge-marker ${out ? 'is-out' : 'is-in'}`}
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="fk-gauge-scale fk-mono">
        <span>
          {Math.round(min)}
          {unit}
        </span>
        <span className="fk-gauge-ideal-label">
          idéal {ideal}
          {unit}
        </span>
        <span>
          {Math.round(max)}
          {unit}
        </span>
      </div>
    </div>
  )
}
