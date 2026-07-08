import { useEffect, useMemo, type ReactNode } from "react";
import { Warehouse } from "lucide-react";
import { Button, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { WarehouseCard } from "@/components/metier";
import { useCountryFilter } from "@/hooks/country-context";
import { useAsync } from "@/hooks/useAsync";
import { getEntrepots } from "@/api/entrepots";
import { COUNTRIES, scopeName, type CountryCode } from "@/lib/countries";
import type { EntrepotStatut } from "@/api/types";
import "./Entrepots.css";

const SKELETON_CARDS = ["s0", "s1", "s2", "s3", "s4", "s5"];

export function Entrepots() {
  const { scope } = useCountryFilter();
  useEffect(() => {
    document.title = "FutureKawa — Entrepôts";
  }, []);

  const { data, loading, error, refetch } = useAsync((s) => getEntrepots(scope, s), [scope]);

  const grouped = useMemo(() => {
    const byCountry = new Map<CountryCode, EntrepotStatut[]>();
    for (const e of data ?? []) {
      const list = byCountry.get(e.pays) ?? [];
      list.push(e);
      byCountry.set(e.pays, list);
    }
    return COUNTRIES.filter((c) => byCountry.has(c.code)).map((c) => ({
      country: c,
      entrepots: byCountry.get(c.code)!,
    }));
  }, [data]);

  let content: ReactNode;
  if (error) {
    content = (
      <EmptyState
        title="Impossible de charger les entrepôts"
        description={error.message}
        action={
          <Button variant="secondary" size="sm" onClick={refetch}>
            Réessayer
          </Button>
        }
      />
    );
  } else if (loading) {
    content = (
      <div className="ent-grid">
        {SKELETON_CARDS.map((id) => (
          <Skeleton key={id} height={168} radius="var(--fk-radius-card)" />
        ))}
      </div>
    );
  } else if (grouped.length === 0) {
    content = (
      <EmptyState
        icon={<Warehouse size={22} strokeWidth={1.75} />}
        title="Aucun entrepôt"
        description="Aucun entrepôt pour le périmètre sélectionné."
      />
    );
  } else {
    content = grouped.map(({ country, entrepots }) => (
      <section className="ent-country" key={country.code}>
        <div className="ent-country-head">
          <h2 className="fk-h3">{country.name}</h2>
          <span className="fk-mono ent-country-meta">
            idéal {country.ideal.temp}°C · {country.ideal.humidity}%
          </span>
        </div>
        <div className="ent-grid">
          {entrepots.map((e) => (
            <WarehouseCard key={e.id} entrepot={e} />
          ))}
        </div>
      </section>
    ));
  }

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Entrepôts"
        description="Conditions par entrepôt et par pays — dernière mesure et statut global."
      />

      {content}
    </>
  );
}
