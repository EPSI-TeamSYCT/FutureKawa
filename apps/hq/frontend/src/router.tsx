import { createBrowserRouter } from 'react-router-dom'
import { StyleGuide } from '@/pages/StyleGuide'
import { ComponentsGallery } from '@/pages/ComponentsGallery'

/*
 * Phases 1–2 expose the design-system references (tokens + components).
 * Later phases replace these with the AppLayout and its nested routes
 * (Dashboard, Lots, LotDetail, Entrepots, Alertes, Parametres).
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <StyleGuide />,
    },
    {
      path: '/components',
      element: <ComponentsGallery />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
)
