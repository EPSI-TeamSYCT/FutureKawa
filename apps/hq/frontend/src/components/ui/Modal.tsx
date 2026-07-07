import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react'
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

/**
 * Built on the native <dialog> element: focus trapping, Escape-to-close and
 * background inertness come for free and are fully accessible.
 */
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
}: Readonly<ModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    else if (!open && dlg.open) dlg.close()
  }, [open])

  // Escape / close() fire the native 'close' event — keep React state in sync.
  function handleClose() {
    if (open) onClose()
  }

  // A click whose target is the dialog element itself is a backdrop click.
  function handleClick(e: MouseEvent<HTMLDialogElement>) {
    if (closeOnOverlay && e.target === dialogRef.current) onClose()
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fk-modal-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={handleClose}
      onClick={handleClick}
    >
      <div className="fk-modal" style={{ maxWidth: width }}>
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
    </dialog>,
    document.body,
  )
}
