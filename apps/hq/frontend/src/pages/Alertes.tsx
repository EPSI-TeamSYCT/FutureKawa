import { useEffect, type ReactNode } from "react";
import { BellOff } from "lucide-react";
import { Button, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { AlertItem } from "@/components/metier";
import { useCountryFilter } from "@/hooks/country-context";
import { useAsync } from "@/hooks/useAsync";
import { getAlertes } from "@/api/alertes";
import { scopeName } from "@/lib/countries";
import "./Alertes.css";

const SKELETON_ROWS = ["s0", "s1", "s2", "s3"];

export function Alertes() {
  const { scope } = useCountryFilter();

  useEffect(() => {
    document.title = "FutureKawa — Alertes";
  }, []);

  const { data, loading, error, refetch } = useAsync((s) => getAlertes({ scope }, s), [scope]);
  const items = data ?? [];

  let content: ReactNode;
  if (error) {
    content = (
      <EmptyState
        title="Impossible de charger les alertes"
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
      <div className="alr-list">
        {SKELETON_ROWS.map((id) => (
          <Skeleton key={id} height={92} radius="var(--fk-radius-card)" />
        ))}
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <EmptyState
        icon={<BellOff size={22} strokeWidth={1.75} />}
        title="Aucune alerte"
        description="Les conditions et les âges sont dans les seuils pour ce périmètre."
      />
    );
  } else {
    content = (
      <div className="alr-list">
        {items.map((a) => (
          <AlertItem key={a.id} alerte={a} />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={scopeName(scope)}
        title="Alertes"
        description="File priorisée : dérive de conditions ou lot de plus de 365 jours."
      />

      {content}
    </>
  );
}
