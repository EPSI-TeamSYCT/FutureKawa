<?php

namespace App\Alerting;

/**
 * Effective alerting thresholds for one country (ideal band + tolerances).
 */
final class CountryThresholds
{
    public function __construct(
        public readonly float $idealTemp,
        public readonly float $toleranceTemp,
        public readonly float $idealHumidity,
        public readonly float $toleranceHumidity,
    ) {
    }
}
