import { useEffect, useRef } from 'react'

export type HotkeyDestination = 'dashboard' | 'lots' | 'entrepots' | 'alertes' | 'parametres'

export interface HotkeyOptions {
  onOpenPalette: () => void
  onToggleTheme: () => void
  onGo: (dest: HotkeyDestination) => void
  /** Suspend hotkeys (e.g. while the palette is open). ⌘K still works. */
  enabled?: boolean
}

const GO_KEYS: Record<string, HotkeyDestination> = {
  d: 'dashboard',
  l: 'lots',
  e: 'entrepots',
  a: 'alertes',
  p: 'parametres',
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Global keyboard shortcuts:
 *   ⌘K / Ctrl+K  → command palette
 *   /            → command palette (search)
 *   t            → toggle theme
 *   g then d/l/e/a/p → go to Dashboard / Lots / Entrepôts / Alertes / Paramètres
 */
export function useHotkeys({ onOpenPalette, onToggleTheme, onGo, enabled = true }: HotkeyOptions) {
  const pendingG = useRef<number>(0)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // ⌘K / Ctrl+K works everywhere, even while typing.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenPalette()
        return
      }

      if (!enabled) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return

      const key = e.key.toLowerCase()
      const now = Date.now()

      // g-then-<key> sequences.
      if (pendingG.current && now - pendingG.current < 1000 && GO_KEYS[key]) {
        e.preventDefault()
        pendingG.current = 0
        onGo(GO_KEYS[key])
        return
      }
      pendingG.current = 0

      if (key === 'g') {
        pendingG.current = now
        return
      }
      if (key === '/') {
        e.preventDefault()
        onOpenPalette()
        return
      }
      if (key === 't') {
        e.preventDefault()
        onToggleTheme()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, onOpenPalette, onToggleTheme, onGo])
}
