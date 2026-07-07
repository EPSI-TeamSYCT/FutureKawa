import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './Modal.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  /** Icon shown in the caramel tile beside the title. */
  icon?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  /** Max width in px. Charte default is 440. */
  width?: number
  closeOnOverlay?: boolean
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  width = 440,
  closeOnOverlay = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descId = useId()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement as HTMLElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown, true)
    // Focus the first focusable element (or the dialog itself).
    const raf = requestAnimationFrame(() => {
      const node = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(node ?? dialogRef.current)?.focus()
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = overflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    <div className="fk-modal-overlay" onMouseDown={closeOnOverlay ? onClose : undefined}>
      <div
        ref={dialogRef}
        className="fk-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        style={{ maxWidth: width }}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="fk-modal-head">
          {icon && (
            <div className="fk-modal-icon" aria-hidden="true">
              {icon}
            </div>
          )}
          <div className="fk-modal-heading">
            <h2 className="fk-modal-title fk-h3" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="fk-modal-desc" id={descId}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className="fk-modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {children && <div className="fk-modal-body">{children}</div>}
        {footer && <div className="fk-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
