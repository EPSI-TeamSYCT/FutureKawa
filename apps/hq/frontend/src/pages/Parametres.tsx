import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  PageHeader,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { useTheme, type Theme } from "@/hooks/theme-context";
import { COUNTRIES } from "@/lib/countries";
import "./Parametres.css";

const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
const cmd = isMac ? "⌘" : "Ctrl";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: [`${cmd} K`], label: "Ouvrir la palette de commandes" },
  { keys: ["/"], label: "Rechercher" },
  { keys: ["t"], label: "Basculer le thème clair / sombre" },
  { keys: ["g", "d"], label: "Aller au Dashboard" },
  { keys: ["g", "l"], label: "Aller aux Lots" },
  { keys: ["g", "e"], label: "Aller aux Entrepôts" },
  { keys: ["g", "a"], label: "Aller aux Alertes" },
  { keys: ["g", "p"], label: "Aller aux Paramètres" },
];

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Clair", icon: Sun },
  { id: "dark", label: "Sombre", icon: Moon },
];

export function Parametres() {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    document.title = "FutureKawa — Paramètres";
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Thème, seuils par pays, raccourcis clavier et informations."
      />

      <div className="param-grid">
        <Card>
          <CardHeader>
            <CardTitle eyebrow="Apparence">Thème</CardTitle>
          </CardHeader>
          <fieldset className="param-themes" aria-label="Choix du thème">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`param-theme ${theme === t.id ? "is-active" : ""}`.trim()}
                aria-pressed={theme === t.id}
                onClick={() => setTheme(t.id)}
              >
                <t.icon size={18} strokeWidth={1.75} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </fieldset>
          <p className="param-note">Le choix est mémorisé sur cet appareil.</p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle eyebrow="Aide">Raccourcis clavier</CardTitle>
          </CardHeader>
          <ul className="param-shortcuts">
            {SHORTCUTS.map((s) => (
              <li key={s.label}>
                <span className="param-keys">
                  {s.keys.map((k) => (
                    <kbd className="param-kbd" key={k}>
                      {k}
                    </kbd>
                  ))}
                </span>
                <span className="param-shortcut-label">{s.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card flush className="param-thresholds">
        <CardHeader className="param-card-head">
          <CardTitle
            eyebrow="Référence"
            action={<span className="fk-mono param-ro">lecture seule</span>}
          >
            Seuils par pays
          </CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <Tr>
              <Th>Pays</Th>
              <Th align="right">Température idéale</Th>
              <Th align="right">Tolérance</Th>
              <Th align="right">Humidité idéale</Th>
              <Th align="right">Tolérance</Th>
            </Tr>
          </THead>
          <TBody>
            {COUNTRIES.map((c) => (
              <Tr key={c.code}>
                <Td>{c.name}</Td>
                <Td align="right" mono>
                  {c.ideal.temp}°C
                </Td>
                <Td align="right" mono>
                  ±{c.tolerance.temp}°C
                </Td>
                <Td align="right" mono>
                  {c.ideal.humidity}%
                </Td>
                <Td align="right" mono>
                  ±{c.tolerance.humidity}%
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card className="param-about">
        <CardHeader>
          <CardTitle eyebrow="À propos">FutureKawa</CardTitle>
        </CardHeader>
        <p className="param-about-tagline">« Du grain à la preuve. »</p>
        <p className="param-about-text">
          Supervision des lots de café vert et des conditions IoT des entrepôts au Brésil, en
          Équateur et en Colombie. Projet MSPR — frontend React consommant l’API du backend central.
        </p>
        <dl className="param-about-meta fk-mono">
          <div>
            <dt>Version</dt>
            <dd>1.0.0</dd>
          </div>
          <div>
            <dt>Données</dt>
            <dd>API HQ (temps réel)</dd>
          </div>
          <div>
            <dt>Thème actif</dt>
            <dd>{theme}</dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
