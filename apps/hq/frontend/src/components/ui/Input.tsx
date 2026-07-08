import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import "./Field.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Render the value in IBM Plex Mono (lot refs, technical values). */
  mono?: boolean;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, mono = false, leadingIcon, id, className = "", ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  let describedBy: string | undefined;
  if (error) describedBy = `${inputId}-err`;
  else if (hint) describedBy = `${inputId}-hint`;

  return (
    <div className={`fk-field ${error ? "is-error" : ""} ${className}`.trim()}>
      {label && (
        <label className="fk-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={`fk-field-control ${leadingIcon ? "has-leading" : ""}`.trim()}>
        {leadingIcon && (
          <span className="fk-field-leading" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`fk-input ${mono ? "fk-mono" : ""}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>
      {error ? (
        <p className="fk-field-error" id={`${inputId}-err`}>
          <CircleAlert size={13} strokeWidth={1.75} aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p className="fk-field-hint" id={`${inputId}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
});
