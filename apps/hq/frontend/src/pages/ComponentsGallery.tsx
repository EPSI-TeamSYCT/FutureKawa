import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Download,
  Inbox,
  Plus,
  Search,
  TriangleAlert,
  Trash2,
  Truck,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tabs,
  ThemeToggle,
  Tr,
  useToast,
} from '@/components/ui'
import logo from '@/assets/brand/logo.svg'
import logoBlanc from '@/assets/brand/logo-blanc.svg'
import { useTheme } from '@/hooks/theme-context'
import './StyleGuide.css'
import './ComponentsGallery.css'

const SAMPLE_LOTS = [
  {
    id: 'BR-SAN-2025-0143',
    warehouse: 'Santos-01',
    entry: '2024-08-29',
    age: 312,
    status: { tone: 'success' as const, label: 'CONFORME', Icon: Check },
    cond: '29.4°C · 55%',
  },
  {
    id: 'EC-GUA-2025-0088',
    warehouse: 'Guayaquil-02',
    entry: '2024-06-14',
    age: 388,
    status: { tone: 'alert' as const, label: 'EN ALERTE', Icon: TriangleAlert },
    cond: '34.1°C · 58%',
  },
  {
    id: 'CO-MED-2024-0501',
    warehouse: 'Medellín-01',
    entry: '2023-11-02',
    age: 612,
    status: { tone: 'danger' as const, label: 'PÉRIMÉ', Icon: Clock },
    cond: '26.2°C · 81%',
  },
  {
    id: 'BR-SAN-2024-0377',
    warehouse: 'Santos-01',
    entry: '2024-02-20',
    age: 503,
    status: { tone: 'neutral' as const, label: 'EXPÉDIÉ', Icon: Truck },
    cond: '—',
  },
] as const

function ageTone(age: number): 'neutral' | 'alert' | 'danger' {
  if (age >= 550) return 'danger'
  if (age >= 365) return 'alert'
  return 'neutral'
}

export function ComponentsGallery() {
  const { theme } = useTheme()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'FutureKawa — Composants'
  }, [])

  return (
    <div className="sg">
      <header className="sg-topbar">
        <div className="sg-brand">
          <img src={theme === 'dark' ? logoBlanc : logo} alt="" width={28} height={28} />
          <span>FutureKawa</span>
        </div>
        <div className="sg-topbar-right">
          <Link className="gal-nav-link fk-mono" to="/design">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" /> tokens
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="sg-main">
        <div className="sg-hero">
          <div className="sg-eyebrow">
            <span className="fk-caption">Design system</span>{' '}
            <span className="sg-chip">
              <span className="dot" aria-hidden="true" />
              Phase 2 · composants
            </span>
          </div>
          <h1 className="fk-h1">Composants UI</h1>
          <p className="fk-body-lg">
            Primitives réutilisables construites sur les tokens de la charte — boutons, badges,
            champs, tables, onglets, modale, toasts, skeletons et empty states, dans les deux
            thèmes.
          </p>
        </div>

        {/* Buttons */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Boutons</h2>
            <p>Une seule action caramel (primary) par écran ; le reste en brun café ou ghost.</p>
          </div>
          <div className="gal-row">
            <Button variant="primary" leftIcon={<Plus size={16} strokeWidth={1.75} />}>
              Nouveau lot
            </Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive" leftIcon={<Trash2 size={16} strokeWidth={1.75} />}>
              Supprimer
            </Button>
          </div>
          <div className="gal-row">
            <Button variant="primary" size="sm">
              Petit
            </Button>
            <Button variant="secondary" size="sm">
              Petit
            </Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={() => {
                setLoading(true)
                setTimeout(() => setLoading(false), 1600)
              }}
            >
              {loading ? 'Envoi…' : 'Cliquer pour charger'}
            </Button>
            <Button variant="primary" disabled>
              Désactivé
            </Button>
          </div>
        </section>

        {/* Badges */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Badges &amp; statuts</h2>
            <p>Couleur + icône + libellé — jamais la couleur seule.</p>
          </div>
          <div className="gal-row">
            <Badge tone="success" icon={<Check size={14} strokeWidth={1.75} />}>
              CONFORME
            </Badge>
            <Badge tone="alert" icon={<TriangleAlert size={14} strokeWidth={1.75} />}>
              EN ALERTE
            </Badge>
            <Badge tone="danger" icon={<Clock size={14} strokeWidth={1.75} />}>
              PÉRIMÉ
            </Badge>
            <Badge tone="neutral" icon={<Truck size={14} strokeWidth={1.75} />}>
              EXPÉDIÉ
            </Badge>
          </div>
          <div className="gal-row">
            <Badge tone="neutral" size="sm" dot>
              312 j
            </Badge>
            <Badge tone="alert" size="sm" dot>
              388 j
            </Badge>
            <Badge tone="danger" size="sm" dot>
              612 j
            </Badge>
            <Badge tone="accent" size="sm">
              origine · Santos
            </Badge>
          </div>
        </section>

        {/* Fields */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Champs</h2>
            <p>Valeurs techniques en mono, focus à halo, états d’erreur explicites.</p>
          </div>
          <div className="gal-grid-2">
            <Input
              label="Rechercher un lot"
              placeholder="BR-SAN-2025-0143"
              leadingIcon={<Search size={16} strokeWidth={1.75} />}
              mono
            />
            <Select label="Pays" defaultValue="br">
              <option value="all">Tous les pays</option>
              <option value="br">Brésil</option>
              <option value="ec">Équateur</option>
              <option value="co">Colombie</option>
            </Select>
            <Input
              label="Seuil température (°C)"
              defaultValue="32.0"
              error="Au-delà de la tolérance (+3 °C)."
              mono
            />
            <Input label="Responsable" defaultValue="Ana Ribeiro" hint="Contact d’exploitation." />
          </div>
        </section>

        {/* Table */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Table (FIFO)</h2>
            <p>Header collant, survol de ligne, pas de zébré, ligne expédiée barrée.</p>
          </div>
          <Card flush>
            <Table>
              <THead>
                <Tr>
                  <Th>ID lot</Th>
                  <Th>Entrepôt</Th>
                  <Th>Entrée</Th>
                  <Th align="right">Âge</Th>
                  <Th>Statut</Th>
                  <Th align="right">Conditions</Th>
                </Tr>
              </THead>
              <TBody>
                {SAMPLE_LOTS.map((lot) => (
                  <Tr key={lot.id} muted={lot.status.label === 'EXPÉDIÉ'}>
                    <Td mono>{lot.id}</Td>
                    <Td>{lot.warehouse}</Td>
                    <Td mono>{lot.entry}</Td>
                    <Td align="right">
                      <Badge tone={ageTone(lot.age)} size="sm" dot>
                        {lot.age} j
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        tone={lot.status.tone}
                        size="sm"
                        icon={<lot.status.Icon size={13} strokeWidth={1.75} />}
                      >
                        {lot.status.label}
                      </Badge>
                    </Td>
                    <Td align="right" mono>
                      {lot.cond}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        </section>

        {/* Tabs + cards */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Onglets &amp; cartes</h2>
          </div>
          <Tabs
            items={[
              {
                id: 'apercu',
                label: 'Aperçu',
                content: (
                  <div className="gal-grid-2">
                    <Card>
                      <CardHeader>
                        <CardTitle
                          eyebrow="Entrepôt"
                          action={
                            <Badge tone="success" size="sm" dot>
                              en ligne
                            </Badge>
                          }
                        >
                          Santos-01
                        </CardTitle>
                      </CardHeader>
                      <p className="fk-mono gal-metric">29.4°C · 55%</p>
                    </Card>
                    <Card interactive>
                      <CardHeader>
                        <CardTitle
                          eyebrow="Entrepôt"
                          action={
                            <Badge tone="alert" size="sm" dot>
                              dérive
                            </Badge>
                          }
                        >
                          Guayaquil-02
                        </CardTitle>
                      </CardHeader>
                      <p className="fk-mono gal-metric">34.1°C · 58%</p>
                    </Card>
                  </div>
                ),
              },
              { id: 'lots', label: 'Lots', badge: 40, content: <p>Contenu des lots…</p> },
              { id: 'alertes', label: 'Alertes', badge: 3, content: <p>File des alertes…</p> },
            ]}
          />
        </section>

        {/* Overlays */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Modale &amp; toasts</h2>
          </div>
          <div className="gal-row">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Ouvrir la modale
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  variant: 'success',
                  title: 'Alerte traitée',
                  description: 'EC-GUA-2025-0088',
                })
              }
            >
              Toast succès
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  variant: 'warning',
                  title: 'Dérive détectée',
                  description: 'Guayaquil-02 · 34.1°C',
                })
              }
            >
              Toast alerte
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  variant: 'error',
                  title: 'Envoi e-mail échoué',
                  description: 'retry dans 30 s',
                })
              }
            >
              Toast erreur
            </Button>
          </div>
        </section>

        {/* Loading + empty */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Chargement &amp; vide</h2>
            <p>Skeletons au chargement, empty states dessinés — jamais de spinner plein écran.</p>
          </div>
          <div className="gal-grid-2">
            <Card>
              <div className="gal-skel-line">
                <Skeleton variant="circle" width={40} height={40} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <div style={{ height: 8 }} />
                  <Skeleton variant="text" width="90%" />
                </div>
              </div>
              <div style={{ height: 16 }} />
              <Skeleton height={80} />
            </Card>
            <EmptyState
              icon={<Inbox size={22} strokeWidth={1.75} />}
              title="Aucune alerte active"
              description="Toutes les conditions sont dans les tolérances pour les entrepôts sélectionnés."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Bell size={15} strokeWidth={1.75} />}
                >
                  Configurer les seuils
                </Button>
              }
            />
          </div>
        </section>

        <footer className="sg-footer">FutureKawa · composants — thème actif : {theme}</footer>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        icon={<Download size={20} strokeWidth={1.75} />}
        title="Exporter les lots"
        description="Génère un export CSV des lots filtrés (FIFO)."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false)
                toast({ variant: 'success', title: 'Export lancé', description: '40 lots · CSV' })
              }}
            >
              Exporter
            </Button>
          </>
        }
      >
        <p>
          L’export reprend l’ordre FIFO courant et les filtres actifs (pays, entrepôt, statut). Les
          conditions sont incluses au format mono.
        </p>
      </Modal>
    </div>
  )
}
