import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import './Field.css'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className = '', children, ...rest },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const describedBy = error ? `${selectId}-err` : hint ? `${selectId}-hint` : undefined

  return (
    <div className={`fk-field ${error ? 'is-error' : ''} ${className}`.trim()}>
      {label && (
        <label className="fk-field-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className="fk-field-control fk-select-control">
        <select
          ref={ref}
          id={selectId}
          className="fk-input fk-select"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="fk-select-chevron"
          size={16}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p className="fk-field-error" id={`${selectId}-err`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="fk-field-hint" id={`${selectId}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  )
})
