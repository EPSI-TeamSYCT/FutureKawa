import { createBrowserRouter } from 'react-router-dom'
import { StyleGuide } from '@/pages/StyleGuide'

/*
 * Phase 1 exposes the visual foundation (the style guide) at the root.
 * Later phases replace this with the AppLayout and its nested routes
 * (Dashboard, Lots, LotDetail, Entrepots, Alertes, Parametres).
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <StyleGuide />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
)
