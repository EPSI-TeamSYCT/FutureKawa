import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner and disables the button. */
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

/**
 * The one primary (caramel) action per screen uses `variant="primary"`.
 * Everything else is `secondary` / `ghost`; `destructive` for irreversible actions.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = [
    'fk-btn',
    `fk-btn--${variant}`,
    `fk-btn--${size}`,
    fullWidth ? 'fk-btn--block' : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="fk-btn-spinner" aria-hidden="true" />}
      {!loading && leftIcon && (
        <span className="fk-btn-icon" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children != null && <span className="fk-btn-label">{children}</span>}
      {!loading && rightIcon && (
        <span className="fk-btn-icon" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  )
})
