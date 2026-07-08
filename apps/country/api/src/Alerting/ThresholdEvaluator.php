<?php

namespace App\Alerting;

/**
 * Pure, database-free evaluator for the FutureKawa alerting rules.
 *
 * A measure is "out of range" when its temperature or humidity leaves the
 * country's ideal band widened by the configured tolerance:
 *
 *   allowed temperature ∈ [idealTemp - toleranceTemp, idealTemp + toleranceTemp]
 *   allowed humidity    ∈ [idealHumidity - toleranceHumidity, idealHumidity + toleranceHumidity]
 *
 * Country ideals (per the MSPR brief) and the shared tolerances live in
 * {@see CountryThresholdProvider}; this class only compares values so it stays
 * trivially unit-testable.
 */
final class ThresholdEvaluator
{
    /**
     * @return list<Breach> the breaches detected for this reading (empty when in range)
     */
    public function evaluate(
        ?float $temperature,
        ?float $humidity,
        float $idealTemp,
        float $toleranceTemp,
        float $idealHumidity,
        float $toleranceHumidity,
    ): array {
        $breaches = [];

        if (null !== $temperature) {
            $min = $idealTemp - $toleranceTemp;
            $max = $idealTemp + $toleranceTemp;
            if ($temperature < $min || $temperature > $max) {
                $breaches[] = new Breach(Breach::METRIC_TEMPERATURE, $temperature, $min, $max);
            }
        }

        if (null !== $humidity) {
            $min = $idealHumidity - $toleranceHumidity;
            $max = $idealHumidity + $toleranceHumidity;
            if ($humidity < $min || $humidity > $max) {
                $breaches[] = new Breach(Breach::METRIC_HUMIDITY, $humidity, $min, $max);
            }
        }

        return $breaches;
    }

    /**
     * Whether a batch stored on $storageDate is stale (older than $maxAgeDays)
     * as of $now.
     */
    public function isBatchStale(
        \DateTimeImmutable $storageDate,
        \DateTimeImmutable $now,
        int $maxAgeDays,
    ): bool {
        return $storageDate->diff($now)->days > $maxAgeDays;
    }
}
