import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, Clock, TriangleAlert, Warehouse } from "lucide-react";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { KpiCard, WarehouseCard } from "@/components/metier";
import { useCountryFilter } from "@/hooks/country-context";
import { useAsync } from "@/hooks/useAsync";
import { getLots } from "@/api/lots";
import { getEntrepots } from "@/api/entrepots";
import { getAlertes } from "@/api/alertes";
import { scopeName } from "@/lib/countries";
import { relativeTime } from "@/lib/format";
import type { Alerte } from "@/api/types";
import type { ReactNode } from "react";
import "./Dashboard.css";

const KPI_SKELETONS = ["k0", "k1", "k2", "k3"];
const WAREHOUSE_SKELETONS = ["w0", "w1", "w2", "w3"];
const ALERT_SKELETONS = ["a0", "a1", "a2", "a3", "a4"];

/** Deterministic gentle series for KPI sparklines (decorative trend shape). */
function miniTrend(seed: number, points = 8): number[] {
  const out: number[] = [];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  let v = 50;
  for (let i = 0; i < points; i++) {
    s = (s * 16807) % 2147483647;
    v = Math.max(8, Math.min(92, v + (s / 2147483647 - 0.45) * 14));
    out.push(Math.round(v));
  }
  return out;
}
const deltaOf = (trend: number[]) => Math.round((trend.at(-1)! - trend[0]) / 8);

export function Dashboard() {
  const { scope } = useCountryFilter();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "FutureKawa — Dashboard";
  }, []);

  const lotsQ = useAsync((s) => getLots({ scope }, s), [scope]);
  const entrepotsQ = useAsync((s) => getEntrepots(scope, s), [scope]);
  const alertesQ = useAsync((s) => getAlertes({ scope }, s), [scope]);

  const kpis = useMemo(() => {
    const lots = lotsQ.data ?? [];
    const entrepots = entrepotsQ.data ?? [];
    const enStock = lots.filter((l) => l.statut !== "EXPEDIE");
    const enAlerte = lots.filter((l) => l.statut === "EN_ALERTE" || l.statut === "PERIME").length;
    const ageMoyen = enStock.length
      ? Math.round(enStock.reduce((a, l) => a + l.ageJours, 0) / enStock.length)
      : 0;
    const horsPlage = entrepots.filter((e) => e.horsPlage).length;
    return { enStock: enStock.length, enAlerte, ageMoyen, horsPlage, total: entrepots.length };
  }, [lotsQ.data, entrepotsQ.data]);

  const ready = !lotsQ.loading && !entrepotsQ.loading;
  const trends = {
    stock: miniTrend(11),
    alerte: miniTrend(29),
    age: miniTrend(43),
  };

  const alertes = alertesQ.data ?? [];
  let alertsContent: ReactNode;
  if (alertesQ.loading) {
    alertsContent = (
      <div className="dash-alert-list">
        {ALERT_SKELETONS.map((id) => (
          <div className="dash-alert-row" key={id}>
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </div>
        ))}
      </div>
    );
  } else if (alertes.length === 0) {
    alertsContent = (
      <EmptyState
        className="dash-alert-empty"
        title="Aucune alerte"
        description="Conditions et âges dans les seuils."
      />
    );
  } else {
    alertsContent = (
      <ul className="dash-alert-list">
        {alertes.slice(0, 5).map((a) => (
          <AlertRow
            key={a.id}
            alerte={a}
            onOpen={() => navigate(a.lotId ? `/lots/${a.lotId}` : `/entrepots/${a.entrepotId}`)}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Dashboard"
        description="Vue consolidée : lots, conditions des entrepôts et dernières alertes."
      />

      <div className="dash-kpis">
        {!ready ? (
          KPI_SKELETONS.map((id) => <KpiSkeleton key={id} />)
        ) : (
          <>
            <KpiCard
              label="Lots en stock"
              value={kpis.enStock}
              icon={<Boxes size={16} strokeWidth={1.75} />}
              delta={deltaOf(trends.stock)}
              trend={trends.stock}
            />
            <KpiCard
              label="Lots en alerte"
              value={kpis.enAlerte}
              icon={<TriangleAlert size={16} strokeWidth={1.75} />}
              delta={deltaOf(trends.alerte)}
              positiveIsGood={false}
              trend={trends.alerte}
              trendColor="var(--fk-alert)"
            />
            <KpiCard
              label="Âge moyen"
              value={kpis.ageMoyen}
              unit="j"
              icon={<Clock size={16} strokeWidth={1.75} />}
              delta={deltaOf(trends.age)}
              deltaSuffix=" j"
              positiveIsGood={false}
              trend={trends.age}
            />
            <KpiCard
              label="Entrepôts hors plage"
              value={
                <>
                  {kpis.horsPlage}
                  <span className="dash-kpi-total">/{kpis.total}</span>
                </>
              }
              icon={<Warehouse size={16} strokeWidth={1.75} />}
            />
          </>
        )}
      </div>

      <div className="dash-grid">
        {/* Warehouses */}
        <section className="dash-warehouses">
          <div className="dash-section-head">
            <h2 className="fk-h3">Entrepôts</h2>
            <Link className="dash-link fk-mono" to="/entrepots">
              tout voir <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
          {entrepotsQ.loading ? (
            <div className="dash-wh-grid">
              {WAREHOUSE_SKELETONS.map((id) => (
                <Skeleton key={id} height={168} radius="var(--fk-radius-card)" />
              ))}
            </div>
          ) : (
            <div className="dash-wh-grid">
              {(entrepotsQ.data ?? []).map((e) => (
                <WarehouseCard key={e.id} entrepot={e} />
              ))}
            </div>
          )}
        </section>

        {/* Alerts feed */}
        <section className="dash-alerts">
          <Card flush>
            <CardHeader className="dash-alerts-head">
              <CardTitle
                eyebrow="Priorité"
                action={
                  <Link className="dash-link fk-mono" to="/alertes">
                    file <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                }
              >
                Dernières alertes
              </CardTitle>
            </CardHeader>
            {alertsContent}
          </Card>
        </section>
      </div>
    </>
  );
}

function AlertRow({ alerte, onOpen }: Readonly<{ alerte: Alerte; onOpen: () => void }>) {
  const drift = alerte.type === "DERIVE";
  return (
    <li>
      <button type="button" className="dash-alert-row is-clickable" onClick={onOpen}>
        <div className="dash-alert-top">
          <Badge tone={drift ? "alert" : "danger"} size="sm" dot>
            {drift ? "Dérive" : "Péremption"}
          </Badge>
          <span className="fk-mono dash-alert-time">{relativeTime(alerte.timestamp)}</span>
        </div>
        <p className="dash-alert-msg">{alerte.message}</p>
      </button>
    </li>
  );
}

function KpiSkeleton() {
  return (
    <div className="dash-kpi-skel">
      <Skeleton variant="text" width={90} />
      <Skeleton variant="text" width={70} height={30} />
      <Skeleton variant="text" width="100%" height={24} />
    </div>
  );
}
