import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/ThemeProvider'
import { ToastProvider } from '@/components/ui'
import { router } from '@/router'

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </ToastProvider>
    </ThemeProvider>
  )
}
