import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { ConditionsGauge, LiveIndicator, TempHumidityChart } from "@/components/metier";
import { useAsync } from "@/hooks/useAsync";
import { usePolling } from "@/hooks/usePolling";
import { getEntrepot } from "@/api/entrepots";
import { getEntrepotMesures } from "@/api/mesures";
import { getCountry } from "@/lib/countries";
import { relativeTime } from "@/lib/format";
import "./EntrepotDetail.css";

const POLL_MS = 30_000;

export function EntrepotDetail() {
  const { id = "" } = useParams();

  const entrepotQ = usePolling((s) => getEntrepot(id, s), [id], POLL_MS);
  const mesuresQ = useAsync((s) => getEntrepotMesures(id, "24h", s), [id]);

  const entrepot = entrepotQ.data;
  useEffect(() => {
    document.title = `FutureKawa — ${entrepot?.nom ?? "Entrepôt"}`;
  }, [entrepot]);

  if (entrepotQ.error) {
    return (
      <>
        <PageHeader eyebrow="Entrepôt" title={id} />
        <EmptyState
          title="Entrepôt introuvable"
          description={entrepotQ.error.message}
          action={
            <Link to="/entrepots">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={15} strokeWidth={1.75} />}
              >
                Retour aux entrepôts
              </Button>
            </Link>
          }
        />
      </>
    );
  }

  const country = entrepot ? getCountry(entrepot.pays) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Entrepôt"
        title={entrepot?.nom ?? id}
        description={
          <Link className="entd-back" to="/entrepots">
            <ArrowLeft size={13} strokeWidth={1.75} aria-hidden="true" /> Retour aux entrepôts
          </Link>
        }
        actions={
          entrepot ? (
            <Badge tone={entrepot.horsPlage ? "alert" : "success"} dot>
              {entrepot.horsPlage ? "Hors plage" : "Conforme"}
            </Badge>
          ) : undefined
        }
      />

      {/* Live conditions */}
      <Card className="entd-conditions">
        <CardHeader>
          <CardTitle
            eyebrow={entrepot?.ville}
            action={
              <span className="entd-live">
                <LiveIndicator tone={entrepot?.horsPlage ? "alert" : "success"} label="live" />
                {entrepotQ.lastUpdated && (
                  <span className="fk-mono entd-updated">
                    maj {relativeTime(new Date(entrepotQ.lastUpdated).toISOString())}
                  </span>
                )}
              </span>
            }
          >
            Conditions actuelles
          </CardTitle>
        </CardHeader>

        {!entrepot || !country ? (
          <div className="entd-gauges">
            <Skeleton height={72} />
            <Skeleton height={72} />
          </div>
        ) : (
          <div className="entd-gauges">
            <ConditionsGauge
              label="Température"
              value={entrepot.derniereMesure.temp}
              ideal={country.ideal.temp}
              tolerance={country.tolerance.temp}
              unit="°C"
            />
            <ConditionsGauge
              label="Humidité"
              value={entrepot.derniereMesure.humidity}
              ideal={country.ideal.humidity}
              tolerance={country.tolerance.humidity}
              unit="%"
            />
          </div>
        )}
      </Card>

      {/* 24h chart */}
      <Card>
        <CardHeader>
          <CardTitle eyebrow="Dernières 24 h">Température &amp; humidité</CardTitle>
        </CardHeader>
        {mesuresQ.loading || !country ? (
          <Skeleton height={340} />
        ) : (
          <TempHumidityChart mesures={mesuresQ.data ?? []} country={country} />
        )}
      </Card>
    </>
  );
}
