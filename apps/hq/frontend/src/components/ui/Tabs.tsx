import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import './Tabs.css'

export interface TabItem {
  id: string
  label: ReactNode
  content: ReactNode
  /** Optional trailing count/badge shown in the tab. */
  badge?: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  defaultId?: string
  value?: string
  onValueChange?: (id: string) => void
  className?: string
}

/** Accessible tabs: roving focus, ←/→/Home/End keyboard support. */
export function Tabs({ items, defaultId, value, onValueChange, className = '' }: TabsProps) {
  const baseId = useId()
  const [internal, setInternal] = useState(defaultId ?? items[0]?.id)
  const active = value ?? internal
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function select(id: string) {
    if (value === undefined) setInternal(id)
    onValueChange?.(id)
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1
    let next = index
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    const item = items[next]
    select(item.id)
    tabRefs.current[next]?.focus()
  }

  const activeItem = items.find((i) => i.id === active) ?? items[0]

  return (
    <div className={`fk-tabs ${className}`.trim()}>
      <div className="fk-tablist" role="tablist">
        {items.map((item, index) => {
          const selected = item.id === active
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={`fk-tab ${selected ? 'is-active' : ''}`.trim()}
              onClick={() => select(item.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              {item.label}
              {item.badge != null && <span className="fk-tab-badge">{item.badge}</span>}
            </button>
          )
        })}
      </div>
      {activeItem && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeItem.id}`}
          aria-labelledby={`${baseId}-tab-${activeItem.id}`}
          className="fk-tabpanel"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  )
}
