import type { HTMLAttributes, ReactNode } from 'react'
import './Card.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover elevation + a subtle lift — use for clickable cards. */
  interactive?: boolean
  /** Remove the default inner padding (e.g. when the card wraps a table). */
  flush?: boolean
}

export function Card({
  interactive = false,
  flush = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    'fk-card',
    interactive ? 'fk-card--interactive' : '',
    flush ? 'fk-card--flush' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`fk-card-header ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}

export interface CardTitleProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: ReactNode
  action?: ReactNode
}

export function CardTitle({ eyebrow, action, children, className = '', ...rest }: CardTitleProps) {
  return (
    <div className={`fk-card-title ${className}`.trim()} {...rest}>
      <div>
        {eyebrow && <div className="fk-card-eyebrow fk-caption">{eyebrow}</div>}
        <div className="fk-h4">{children}</div>
      </div>
      {action && <div className="fk-card-action">{action}</div>}
    </div>
  )
}
