import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import type { ToastItem, ToastVariant } from "./toast-context";
import "./Toast.css";

const ICONS: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}

export function Toast({ toast, onDismiss }: Readonly<ToastProps>) {
  const variant = toast.variant ?? "info";
  const Icon = ICONS[variant];
  return (
    <div className={`fk-toast fk-toast--${variant}`} role="status" aria-live="polite">
      <span className="fk-toast-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="fk-toast-body">
        <p className="fk-toast-title">{toast.title}</p>
        {toast.description && <p className="fk-toast-desc fk-mono">{toast.description}</p>}
      </div>
      <button
        type="button"
        className="fk-toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
      >
        <X size={15} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
