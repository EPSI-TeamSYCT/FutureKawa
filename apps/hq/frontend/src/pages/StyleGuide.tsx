import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock, TriangleAlert, Truck } from 'lucide-react'
import { useTheme } from '@/hooks/theme-context'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import logo from '@/assets/brand/logo.svg'
import logoBlanc from '@/assets/brand/logo-blanc.svg'
import logoCaramel from '@/assets/brand/logo-caramel.svg'
import lockup from '@/assets/brand/lockup.svg'
import './StyleGuide.css'

/* ---- Data ---------------------------------------------------------------- */

const SEMANTIC_TOKENS = [
  { name: 'bg', token: '--fk-bg', role: 'Fond de l’application' },
  { name: 'surface', token: '--fk-surface', role: 'Cartes, panneaux, modales' },
  { name: 'inset', token: '--fk-inset', role: 'Champs, zones de code, puits' },
  { name: 'border', token: '--fk-border', role: 'Bordures, séparateurs' },
  { name: 'text', token: '--fk-text', role: 'Texte principal' },
  { name: 'text-muted', token: '--fk-text-muted', role: 'Texte secondaire, légendes' },
  { name: 'accent', token: '--fk-accent', role: 'Liens, focus, action secondaire' },
  { name: 'cta', token: '--fk-cta', role: 'Action principale' },
  { name: 'alert', token: '--fk-alert', role: 'Signal « EN ALERTE »' },
  { name: 'success', token: '--fk-success', role: 'Statut « CONFORME »' },
  { name: 'danger', token: '--fk-danger', role: 'Statut « PÉRIMÉ », erreur' },
] as const

const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const

const RAMPS = [
  { label: 'Espresso', prefix: '--fk-espresso' },
  { label: 'Brun café', prefix: '--fk-coffee' },
  { label: 'Caramel', prefix: '--fk-caramel' },
  { label: 'Neutres chauds', prefix: '--fk-neutre' },
] as const

const TYPE_ROWS = [
  { cls: 'fk-display', sample: 'Kawa', meta: '64 / 60 · 800 · −.03em' },
  { cls: 'fk-h1', sample: 'Du grain à la preuve', meta: '40 / 44 · 800 · −.02em' },
  { cls: 'fk-h2', sample: 'Supervision des lots', meta: '28 / 34 · 700 · −.01em' },
  { cls: 'fk-h3', sample: 'Conditions des entrepôts', meta: '20 / 28 · 600' },
  { cls: 'fk-h4', sample: 'Dernières alertes', meta: '16 / 22 · 600' },
  {
    cls: 'fk-body-lg',
    sample: 'Texte courant large pour les introductions.',
    meta: '16 / 26 · 400',
  },
  { cls: '', sample: 'Texte d’interface, tables et formulaires.', meta: '14 / 22 · 400' },
  { cls: 'fk-small', sample: 'Aide contextuelle et métadonnées.', meta: '12 / 18 · 500' },
  { cls: 'fk-caption', sample: 'Libellé de section', meta: '11 / 16 · 500 · +.08em' },
  { cls: 'fk-mono', sample: 'BR-SAN-2025-0143 · 29.4°C · 312 j', meta: '13 / 20 · mono' },
] as const

const STATUSES = [
  { key: 'conforme', label: 'CONFORME', Icon: Check },
  { key: 'alerte', label: 'EN ALERTE', Icon: TriangleAlert },
  { key: 'perime', label: 'PÉRIMÉ', Icon: Clock },
  { key: 'expedie', label: 'EXPÉDIÉ', Icon: Truck },
] as const

const ELEVATIONS = [
  { cls: 'e1', label: 'Élévation 1 · carte' },
  { cls: 'e2', label: 'Élévation 2 · flottant' },
  { cls: 'e3', label: 'Élévation 3 · modale' },
] as const

const RADII = [
  { token: '--fk-radius-badge', label: '4 · badge' },
  { token: '--fk-radius-btn', label: '6 · bouton' },
  { token: '--fk-radius-card', label: '8 · carte' },
  { token: '--fk-radius-panel', label: '10 · panneau' },
  { token: '--fk-radius-modal', label: '12 · modale' },
  { token: '--fk-radius-full', label: 'full · avatar' },
] as const

const SPACES = [4, 8, 12, 16, 24, 32, 48, 64] as const

/* ---- Helpers ------------------------------------------------------------- */

/** Read a CSS custom property off <html>, recomputed whenever the theme flips. */
function useCssVar() {
  const { theme } = useTheme()
  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement)
    return (token: string) => styles.getPropertyValue(token).trim()
    // theme is the intentional recompute trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])
}

/** Pick readable text (espresso vs cream) for a hex background. */
function readableOn(hex: string): string {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim())
  if (!m) return '#3b2a20'
  const int = Number.parseInt(m[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.55 ? '#3b2a20' : '#f0e9df'
}

/* ---- Page ---------------------------------------------------------------- */

export function StyleGuide() {
  const { theme } = useTheme()
  const readVar = useCssVar()

  useEffect(() => {
    document.title = 'FutureKawa — Design system'
  }, [])

  return (
    <div className="sg">
      <header className="sg-topbar">
        <div className="sg-brand">
          <img src={theme === 'dark' ? logoBlanc : logo} alt="" width={28} height={28} />
          <span>FutureKawa</span>
        </div>
        <div className="sg-topbar-right">
          <Link className="sg-nav-link fk-mono" to="/">
            ← app
          </Link>
          <Link className="sg-nav-link fk-mono" to="/design/components">
            composants <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
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
              <span>Phase 1 · socle</span>
            </span>
          </div>
          <h1 className="fk-h1">Socle visuel FutureKawa</h1>
          <p className="fk-body-lg">
            Fondations extraites de la charte : tokens sémantiques, échelles de couleur,
            typographie, espacements, rayons et élévations — dans les deux thèmes. Utilise le bouton
            en haut à droite pour basculer clair / sombre : chaque valeur ci-dessous s’actualise.
          </p>
        </div>

        {/* Logo */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Logo</h2>
            <p>Picto « grain espresso » et lockup — utilisés tels quels, jamais redessinés.</p>
          </div>
          <div className="sg-logos">
            <div className="sg-logo-tile sg-logo-tile--light">
              <img src={logo} alt="Picto FutureKawa espresso" />
              <span className="sg-logo-caption">espresso · fond clair</span>
            </div>
            <div className="sg-logo-tile sg-logo-tile--dark">
              <img src={logoBlanc} alt="Picto FutureKawa blanc" />
              <span className="sg-logo-caption">blanc · sidebar</span>
            </div>
            <div className="sg-logo-tile sg-logo-tile--caramel">
              <img src={logoCaramel} alt="Picto FutureKawa caramel" />
              <span className="sg-logo-caption">caramel · signal</span>
            </div>
            <div className="sg-logo-tile wide sg-logo-tile--light">
              <img src={lockup} alt="Lockup FutureKawa" />
              <span className="sg-logo-caption">lockup · picto + wordmark</span>
            </div>
          </div>
        </section>

        {/* Semantic tokens */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Couleurs sémantiques</h2>
            <p>
              Tokens qui changent de valeur selon le thème mais gardent leur rôle. Aucune couleur en
              dur : les composants lisent uniquement ces{' '}
              <code className="fk-mono">var(--fk-*)</code>.
            </p>
          </div>
          <div className="sg-swatches">
            {SEMANTIC_TOKENS.map((t) => {
              const hex = readVar(t.token)
              return (
                <div className="sg-swatch" key={t.token}>
                  <div className="sg-swatch-chip" style={{ background: `var(${t.token})` }} />
                  <div className="sg-swatch-meta">
                    <div className="sg-swatch-name">{t.name}</div>
                    <div className="sg-swatch-role">{t.role}</div>
                    <div className="sg-swatch-hex">
                      <span>{t.token.replace('--fk-', '')}</span>
                      <span>{hex}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Colour ramps */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Échelles</h2>
            <p>Rampes brutes espresso / brun café / caramel / neutres chauds, de 50 à 950.</p>
          </div>
          <div className="sg-card" style={{ padding: 'var(--fk-sp-24)' }}>
            {RAMPS.map((ramp) => (
              <div className="sg-ramp" key={ramp.prefix}>
                <div className="sg-ramp-label">
                  <b>{ramp.label}</b>
                  <span className="fk-mono" style={{ fontSize: 11, color: 'var(--fk-text-meta)' }}>
                    {ramp.prefix.replace('--fk-', '')}
                  </span>
                </div>
                <div className="sg-ramp-steps">
                  {STEPS.map((step) => {
                    const hex = readVar(`${ramp.prefix}-${step}`)
                    return (
                      <div
                        className="sg-ramp-step"
                        key={step}
                        title={`${ramp.prefix}-${step} · ${hex}`}
                        style={{ background: hex, color: readableOn(hex) }}
                      >
                        {step}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Typographie</h2>
            <p>Archivo pour l’UI, IBM Plex Mono pour toute valeur technique (°C, %, IDs, dates).</p>
          </div>
          <div className="sg-card" style={{ padding: '0 var(--fk-sp-24)' }}>
            {TYPE_ROWS.map((row) => (
              <div className="sg-type-row" key={row.meta}>
                <span className={`sg-type-sample ${row.cls}`}>{row.sample}</span>
                <span className="sg-type-meta">{row.meta}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status badges */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Statuts des lots</h2>
            <p>
              Jamais la couleur seule : pastille + icône + libellé, lisible en cas de daltonisme.
            </p>
          </div>
          <div className="sg-badges">
            {STATUSES.map(({ key, label, Icon }) => (
              <span className={`fk-badge fk-badge--${key}`} key={key}>
                <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Elevations */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Élévations</h2>
            <p>Ombres portées en clair ; en sombre, liseré interne + halo caramel discret.</p>
          </div>
          <div className="sg-elevations">
            {ELEVATIONS.map((e) => (
              <div className={`sg-elevation ${e.cls}`} key={e.cls}>
                {e.label}
              </div>
            ))}
          </div>
        </section>

        {/* Radius */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Rayons</h2>
            <p>Identité « anguleuse-pro » : rayons courts et maîtrisés.</p>
          </div>
          <div className="sg-radii">
            {RADII.map((r) => (
              <div className="sg-radius" key={r.token}>
                <div className="sg-radius-box" style={{ borderRadius: `var(${r.token})` }} />
                <span className="sg-radius-label">{r.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section className="sg-section">
          <div className="sg-section-head">
            <h2 className="fk-h2">Espacements</h2>
            <p>Échelle base-4, de 4 à 64 px.</p>
          </div>
          <div className="sg-spacing">
            {SPACES.map((s) => (
              <div className="sg-space-row" key={s}>
                <span className="sg-space-label">{s} px</span>
                <div className="sg-space-bar" style={{ width: s * 3 }} />
              </div>
            ))}
          </div>
        </section>

        <footer className="sg-footer">
          FutureKawa · charte v1.0 — thème actif : {theme} · « Du grain à la preuve. »
        </footer>
      </main>
    </div>
  )
}
