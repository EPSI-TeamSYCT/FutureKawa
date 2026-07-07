import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import './CommandPalette.css'

export interface CommandItem {
  id: string
  label: string
  group: string
  icon?: ReactNode
  /** Trailing hint (e.g. a shortcut or context). */
  hint?: string
  /** Extra searchable text not shown in the label. */
  keywords?: string
  perform: () => void
}

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands: CommandItem[]
  placeholder?: string
}

/** ⌘K command palette: fuzzy-ish search over pages, warehouses, lots and actions. */
export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = 'Rechercher un lot, un entrepôt, une page…',
}: Readonly<CommandPaletteProps>) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open) {
      if (!dlg.open) dlg.showModal()
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    } else if (dlg.open) {
      dlg.close()
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q),
    )
  }, [query, commands])

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const cmd of filtered) {
      const list = map.get(cmd.group) ?? []
      list.push(cmd)
      map.set(cmd.group, list)
    }
    return [...map.entries()]
  }, [filtered])

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  function run(cmd: CommandItem) {
    cmd.perform()
    onClose()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[activeIndex]
      if (cmd) run(cmd)
    }
    // Escape is handled natively by the <dialog> element.
  }

  // Close on backdrop click — attached natively (not a JSX handler) so a11y
  // linters don't treat the <dialog> as a generic interactive element.
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    const onBackdropClick = (e: MouseEvent) => {
      if (e.target === dlg) onClose()
    }
    dlg.addEventListener('click', onBackdropClick)
    return () => dlg.removeEventListener('click', onBackdropClick)
  }, [onClose])

  // Keep React state in sync when the dialog closes (Escape / close()).
  function handleClose() {
    if (open) onClose()
  }

  let flatIndex = -1

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fk-cmdk-dialog"
      aria-label="Palette de commandes"
      onClose={handleClose}
    >
      <div className="fk-cmdk">
        <div className="fk-cmdk-search">
          <Search size={18} strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={inputRef}
            className="fk-cmdk-input"
            type="text"
            aria-label="Rechercher"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="fk-cmdk-kbd">ESC</kbd>
        </div>

        <div className="fk-cmdk-list">
          {filtered.length === 0 && (
            <p className="fk-cmdk-empty">Aucun résultat pour « {query} »</p>
          )}
          {groups.map(([group, items]) => (
            <div className="fk-cmdk-group" key={group}>
              <div className="fk-cmdk-group-label fk-caption">{group}</div>
              {items.map((cmd) => {
                flatIndex += 1
                const isActive = flatIndex === activeIndex
                const myIndex = flatIndex
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    className={`fk-cmdk-item ${isActive ? 'is-active' : ''}`.trim()}
                    onMouseEnter={() => setActiveIndex(myIndex)}
                    onClick={() => run(cmd)}
                  >
                    {cmd.icon && (
                      <span className="fk-cmdk-item-icon" aria-hidden="true">
                        {cmd.icon}
                      </span>
                    )}
                    <span className="fk-cmdk-item-label">{cmd.label}</span>
                    {cmd.hint && <span className="fk-cmdk-item-hint fk-mono">{cmd.hint}</span>}
                    {isActive && (
                      <CornerDownLeft
                        className="fk-cmdk-item-enter"
                        size={14}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
