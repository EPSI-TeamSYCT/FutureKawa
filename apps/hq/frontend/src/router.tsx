import { createBrowserRouter } from 'react-router-dom'

/*
 * Every page is code-split via route.lazy, so the initial bundle only carries
 * the shell. The two design-system references stay outside the app layout.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      lazy: async () => ({ Component: (await import('@/layouts/AppLayout')).AppLayout }),
      children: [
        { index: true, lazy: async () => ({ Component: (await import('@/pages/Dashboard')).Dashboard }) },
        { path: 'lots', lazy: async () => ({ Component: (await import('@/pages/Lots')).Lots }) },
        { path: 'lots/:id', lazy: async () => ({ Component: (await import('@/pages/LotDetail')).LotDetail }) },
        { path: 'entrepots', lazy: async () => ({ Component: (await import('@/pages/Entrepots')).Entrepots }) },
        {
          path: 'entrepots/:id',
          lazy: async () => ({ Component: (await import('@/pages/EntrepotDetail')).EntrepotDetail }),
        },
        { path: 'alertes', lazy: async () => ({ Component: (await import('@/pages/Alertes')).Alertes }) },
        {
          path: 'parametres',
          lazy: async () => ({ Component: (await import('@/pages/Parametres')).Parametres }),
        },
        { path: '*', lazy: async () => ({ Component: (await import('@/pages/NotFound')).NotFound }) },
      ],
    },
    { path: '/design', lazy: async () => ({ Component: (await import('@/pages/StyleGuide')).StyleGuide }) },
    {
      path: '/design/components',
      lazy: async () => ({ Component: (await import('@/pages/ComponentsGallery')).ComponentsGallery }),
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
)
