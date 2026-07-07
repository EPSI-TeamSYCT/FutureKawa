import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Lots } from '@/pages/Lots'
import { LotDetail } from '@/pages/LotDetail'
import { Entrepots } from '@/pages/Entrepots'
import { EntrepotDetail } from '@/pages/EntrepotDetail'
import { Alertes } from '@/pages/Alertes'
import { Parametres } from '@/pages/Parametres'
import { NotFound } from '@/pages/NotFound'
import { StyleGuide } from '@/pages/StyleGuide'
import { ComponentsGallery } from '@/pages/ComponentsGallery'

/*
 * The app lives under AppLayout (sidebar + topbar + country filter).
 * The two design-system references stay outside the layout, under /design.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'lots', element: <Lots /> },
        { path: 'lots/:id', element: <LotDetail /> },
        { path: 'entrepots', element: <Entrepots /> },
        { path: 'entrepots/:id', element: <EntrepotDetail /> },
        { path: 'alertes', element: <Alertes /> },
        { path: 'parametres', element: <Parametres /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    { path: '/design', element: <StyleGuide /> },
    { path: '/design/components', element: <ComponentsGallery /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
)
