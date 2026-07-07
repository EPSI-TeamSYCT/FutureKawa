import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/ui'

export function Parametres() {
  useEffect(() => {
    document.title = 'FutureKawa — Paramètres'
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Thème, seuils par pays (lecture seule), raccourcis clavier et à propos."
      />
      <EmptyState
        icon={<Settings size={22} strokeWidth={1.75} />}
        title="Paramètres en construction"
        description="Le thème, les seuils par pays, la liste des raccourcis clavier et la section à propos arrivent en Phase 5."
      />
    </>
  )
}
