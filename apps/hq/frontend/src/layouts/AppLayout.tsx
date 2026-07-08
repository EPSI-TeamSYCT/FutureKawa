import { useCallback, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Boxes,
  LayoutDashboard,
  type LucideIcon,
  Moon,
  Search,
  Settings,
  Sun,
  Warehouse,
} from "lucide-react";
import { CommandPalette, type CommandItem } from "@/components/ui/CommandPalette";
import { CountrySelector } from "@/components/metier/CountrySelector";
import { CountryProvider } from "@/hooks/CountryProvider";
import { useCountryFilter } from "@/hooks/country-context";
import { useTheme } from "@/hooks/theme-context";
import { useHotkeys, type HotkeyDestination } from "@/hooks/useHotkeys";
import { useAsync } from "@/hooks/useAsync";
import { getEntrepots } from "@/api/entrepots";
import { getAlertes } from "@/api/alertes";
import { getCountry, SCOPES } from "@/lib/countries";
import logoBlanc from "@/assets/brand/logo-blanc.svg";
import "./AppLayout.css";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/lots", label: "Lots", icon: Boxes },
  { to: "/entrepots", label: "Entrepôts", icon: Warehouse },
  { to: "/alertes", label: "Alertes", icon: Bell },
  { to: "/parametres", label: "Paramètres", icon: Settings },
];

const DEST_PATH: Record<HotkeyDestination, string> = {
  dashboard: "/",
  lots: "/lots",
  entrepots: "/entrepots",
  alertes: "/alertes",
  parametres: "/parametres",
};

const CRUMB_LABELS: Record<string, string> = {
  lots: "Lots",
  entrepots: "Entrepôts",
  alertes: "Alertes",
  parametres: "Paramètres",
};

const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

function useBreadcrumb() {
  const { pathname } = useLocation();
  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Dashboard", to: "/" }];
    const crumbs: { label: string; to: string }[] = [];
    let acc = "";
    segments.forEach((seg) => {
      acc += `/${seg}`;
      crumbs.push({ label: CRUMB_LABELS[seg] ?? seg, to: acc });
    });
    return crumbs;
  }, [pathname]);
}

function AppShell() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { setScope } = useCountryFilter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const crumbs = useBreadcrumb();

  const onGo = useCallback((dest: HotkeyDestination) => navigate(DEST_PATH[dest]), [navigate]);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const { data: entrepots } = useAsync((signal) => getEntrepots("siege", signal), []);
  const { data: alertes } = useAsync((signal) => getAlertes({}, signal), []);
  const alertCount = alertes?.length ?? 0;

  useHotkeys({
    onOpenPalette: openPalette,
    onToggleTheme: toggleTheme,
    onGo,
    enabled: !paletteOpen,
  });

  const commands = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = NAV.map((item) => ({
      id: `page-${item.to}`,
      label: item.label,
      group: "Pages",
      icon: <item.icon size={16} strokeWidth={1.75} />,
      keywords: "aller naviguer page",
      perform: () => navigate(item.to),
    }));
    const warehouses: CommandItem[] = (entrepots ?? []).map((w) => ({
      id: `wh-${w.id}`,
      label: w.nom,
      group: "Entrepôts",
      hint: getCountry(w.pays).name,
      icon: <Warehouse size={16} strokeWidth={1.75} />,
      keywords: `entrepot ${w.nom} ${w.pays}`,
      perform: () => navigate(`/entrepots/${w.id}`),
    }));
    const actions: CommandItem[] = [
      {
        id: "action-theme",
        label: "Basculer le thème clair / sombre",
        group: "Actions",
        icon: <Moon size={16} strokeWidth={1.75} />,
        hint: "t",
        keywords: "theme sombre clair dark light",
        perform: toggleTheme,
      },
      ...SCOPES.map((s) => ({
        id: `scope-${s.code}`,
        label: `Vue ${s.name}`,
        group: "Actions",
        icon: <Bell size={16} strokeWidth={1.75} />,
        keywords: `pays filtre ${s.name}`,
        perform: () => setScope(s.code),
      })),
    ];
    return [...pages, ...warehouses, ...actions];
  }, [navigate, toggleTheme, setScope, entrepots]);

  return (
    <div className="fk-app">
      <aside className="fk-sidebar" aria-label="Navigation principale">
        <div className="fk-sidebar-brand">
          <img src={logoBlanc} alt="" width={26} height={26} />
          <span>FutureKawa</span>
        </div>

        <nav className="fk-sidebar-nav">
          {NAV.map((item) => {
            const badge = item.to === "/alertes" ? alertCount : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `fk-nav-item ${isActive ? "is-active" : ""}`.trim()}
              >
                <item.icon
                  className="fk-nav-icon"
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="fk-nav-label">{item.label}</span>
                {badge > 0 && <span className="fk-nav-badge fk-mono">{badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="fk-sidebar-foot">
          <span className="fk-mono">v1.0 · MSPR</span>
        </div>
      </aside>

      <div className="fk-main">
        <header className="fk-topbar">
          <nav className="fk-breadcrumb" aria-label="Fil d’Ariane">
            {crumbs.map((c, i) => (
              <span key={c.to} className="fk-crumb">
                {i > 0 && <span className="fk-crumb-sep">/</span>}
                {i === crumbs.length - 1 ? (
                  <span className="fk-crumb-current" aria-current="page">
                    {c.label}
                  </span>
                ) : (
                  <NavLink to={c.to} className="fk-crumb-link">
                    {c.label}
                  </NavLink>
                )}
              </span>
            ))}
          </nav>

          <div className="fk-topbar-right">
            <button
              type="button"
              className="fk-search-trigger"
              onClick={openPalette}
              aria-label="Ouvrir la recherche"
            >
              <Search size={15} strokeWidth={1.75} aria-hidden="true" />
              <span className="fk-search-trigger-label">Rechercher…</span>
              <kbd className="fk-search-kbd">{isMac ? "⌘K" : "Ctrl K"}</kbd>
            </button>

            <CountrySelector />

            <button
              type="button"
              className="fk-icon-btn"
              onClick={toggleTheme}
              aria-label="Basculer le thème"
            >
              <ThemeGlyph />
            </button>

            <div className="fk-avatar" title="Opérateur siège" aria-hidden="true">
              OP
            </div>
          </div>
        </header>

        <main className="fk-content">
          <Outlet />
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}

function ThemeGlyph() {
  const { theme } = useTheme();
  return theme === "dark" ? (
    <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
  ) : (
    <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
  );
}

export function AppLayout() {
  return (
    <CountryProvider>
      <AppShell />
    </CountryProvider>
  );
}
