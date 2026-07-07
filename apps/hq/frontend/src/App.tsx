import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/ThemeProvider'
import { router } from '@/router'

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ThemeProvider>
  )
}
