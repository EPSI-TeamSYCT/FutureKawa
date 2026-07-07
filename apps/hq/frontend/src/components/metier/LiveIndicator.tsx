import './LiveIndicator.css'

export interface LiveIndicatorProps {
  label?: string
  /** Tone of the pulse; defaults to success (live/healthy). */
  tone?: 'success' | 'alert'
}

/** Small pulsing dot marking a real-time / live value. */
export function LiveIndicator({ label = 'live', tone = 'success' }: Readonly<LiveIndicatorProps>) {
  return (
    <span className={`fk-live fk-live--${tone}`}>
      <span className="fk-live-dot" aria-hidden="true" />
      <span className="fk-live-label fk-mono">{label}</span>
    </span>
  )
}
