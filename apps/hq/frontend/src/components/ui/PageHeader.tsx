import type { ReactNode } from 'react'
import './PageHeader.css'

export interface PageHeaderProps {
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, eyebrow, description, actions }: Readonly<PageHeaderProps>) {
  return (
    <header className="fk-page-header">
      <div className="fk-page-header-text">
        {eyebrow && <div className="fk-caption fk-page-eyebrow">{eyebrow}</div>}
        <h1 className="fk-h2 fk-page-title">{title}</h1>
        {description && <p className="fk-page-desc">{description}</p>}
      </div>
      {actions && <div className="fk-page-actions">{actions}</div>}
    </header>
  )
}
