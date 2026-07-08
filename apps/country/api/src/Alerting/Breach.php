<?php

namespace App\Alerting;

/**
 * A single out-of-range finding for one metric of one measure.
 */
final class Breach
{
    public const METRIC_TEMPERATURE = 'temperature';
    public const METRIC_HUMIDITY = 'humidity';

    public function __construct(
        public readonly string $metric,
        public readonly float $value,
        public readonly float $allowedMin,
        public readonly float $allowedMax,
    ) {
    }

    public function unit(): string
    {
        return self::METRIC_TEMPERATURE === $this->metric ? '°C' : '%';
    }

    public function describe(): string
    {
        return sprintf(
            '%s %.1f%s outside allowed range [%.1f%s, %.1f%s]',
            ucfirst($this->metric),
            $this->value,
            $this->unit(),
            $this->allowedMin,
            $this->unit(),
            $this->allowedMax,
            $this->unit(),
        );
    }
}
