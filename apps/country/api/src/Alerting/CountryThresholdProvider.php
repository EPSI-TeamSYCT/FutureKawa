<?php

namespace App\Alerting;

use App\Entity\Country;

/**
 * Central, configurable source of the alerting thresholds.
 *
 * A {@see Country} row normally carries its own ideal band and tolerances
 * (set in the admin / fixtures). When those are missing, this provider falls
 * back to the values mandated by the MSPR brief, keyed by ISO code:
 *
 *   Brazil   (BR) 29°C / 55%
 *   Ecuador  (EC) 31°C / 60%
 *   Colombia (CO) 26°C / 80%
 *
 * Shared tolerances: ±3°C temperature, ±2% humidity, and a stale-batch age
 * of 365 days. Keeping them here (instead of scattered magic numbers) makes
 * the policy auditable and easy to tune.
 */
final class CountryThresholdProvider
{
    public const STALE_BATCH_MAX_AGE_DAYS = 365;

    private const DEFAULT_TOLERANCE_TEMP = 3.0;
    private const DEFAULT_TOLERANCE_HUMIDITY = 2.0;

    /**
     * Fallback ideals per ISO code: [idealTemp, idealHumidity].
     *
     * @var array<string, array{float, float}>
     */
    private const DEFAULT_IDEALS = [
        'BR' => [29.0, 55.0],
        'EC' => [31.0, 60.0],
        'CO' => [26.0, 80.0],
    ];

    public function forCountry(Country $country): CountryThresholds
    {
        [$fallbackTemp, $fallbackHumidity] = self::DEFAULT_IDEALS[strtoupper((string) $country->getIsoCode())]
            ?? [$country->getIdealTemp() ?? 0.0, $country->getIdealHumidity() ?? 0.0];

        return new CountryThresholds(
            idealTemp: $this->positiveOr($country->getIdealTemp(), $fallbackTemp),
            toleranceTemp: $this->positiveOr($country->getToleranceTemp(), self::DEFAULT_TOLERANCE_TEMP),
            idealHumidity: $this->positiveOr($country->getIdealHumidity(), $fallbackHumidity),
            toleranceHumidity: $this->positiveOr($country->getToleranceHumidity(), self::DEFAULT_TOLERANCE_HUMIDITY),
        );
    }

    public function staleBatchMaxAgeDays(): int
    {
        return self::STALE_BATCH_MAX_AGE_DAYS;
    }

    private function positiveOr(?float $value, float $fallback): float
    {
        return (null !== $value && $value > 0.0) ? $value : $fallback;
    }
}
