import type { ReactNode } from 'react'
import grain from '@/assets/brand/logo.svg'
import './EmptyState.css'

export interface EmptyStateProps {
  /** Lucide icon element shown above the title. */
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/** Drawn empty state with the grain picto as a faint watermark — never a blank panel. */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`fk-empty ${className}`.trim()} role="status">
      <img className="fk-empty-watermark" src={grain} alt="" aria-hidden="true" />
      <div className="fk-empty-content">
        {icon && (
          <div className="fk-empty-icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="fk-empty-title fk-h4">{title}</h3>
        {description && <p className="fk-empty-desc">{description}</p>}
        {action && <div className="fk-empty-action">{action}</div>}
      </div>
    </div>
  )
}
