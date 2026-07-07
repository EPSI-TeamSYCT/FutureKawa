import { createContext, useContext } from 'react'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  /** Auto-dismiss delay in ms. 0 keeps it until dismissed. Default 5000. */
  duration?: number
}

export interface ToastItem extends ToastInput {
  id: number
}

export interface ToastContextValue {
  toast: (input: ToastInput) => number
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
