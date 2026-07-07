import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import '@/styles/fonts.css'
import '@/styles/tokens.css'
import '@/styles/base.css'

/** Boot the MSW mock layer unless explicitly disabled (offline jury demo default). */
async function enableMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS === 'false') return
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

enableMocks().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
