import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button, EmptyState, PageHeader } from '@/components/ui'

export function NotFound() {
  useEffect(() => {
    document.title = 'FutureKawa — Page introuvable'
  }, [])

  return (
    <>
      <PageHeader eyebrow="Erreur 404" title="Page introuvable" />
      <EmptyState
        icon={<Compass size={22} strokeWidth={1.75} />}
        title="Cette page n’existe pas"
        description="Le lien est peut-être obsolète ou l’identifiant incorrect."
        action={
          <Link to="/">
            <Button variant="secondary" size="sm">
              Retour au dashboard
            </Button>
          </Link>
        }
      />
    </>
  )
}
