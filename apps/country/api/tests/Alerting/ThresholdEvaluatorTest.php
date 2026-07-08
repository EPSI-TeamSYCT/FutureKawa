<?php

namespace App\Tests\Alerting;

use App\Alerting\Breach;
use App\Alerting\ThresholdEvaluator;
use PHPUnit\Framework\TestCase;

final class ThresholdEvaluatorTest extends TestCase
{
    private ThresholdEvaluator $evaluator;

    protected function setUp(): void
    {
        $this->evaluator = new ThresholdEvaluator();
    }

    public function testInRangeReadingYieldsNoBreach(): void
    {
        // Brazil: 29°C ±3 -> [26,32], 55% ±2 -> [53,57].
        $breaches = $this->evaluator->evaluate(29.0, 55.0, 29.0, 3.0, 55.0, 2.0);

        self::assertSame([], $breaches);
    }

    public function testTemperatureAtBoundaryIsInRange(): void
    {
        $low = $this->evaluator->evaluate(26.0, 55.0, 29.0, 3.0, 55.0, 2.0);
        $high = $this->evaluator->evaluate(32.0, 55.0, 29.0, 3.0, 55.0, 2.0);

        self::assertSame([], $low);
        self::assertSame([], $high);
    }

    public function testTemperatureAboveMaxBreaches(): void
    {
        $breaches = $this->evaluator->evaluate(33.0, 55.0, 29.0, 3.0, 55.0, 2.0);

        self::assertCount(1, $breaches);
        self::assertSame(Breach::METRIC_TEMPERATURE, $breaches[0]->metric);
        self::assertSame(33.0, $breaches[0]->value);
        self::assertSame(26.0, $breaches[0]->allowedMin);
        self::assertSame(32.0, $breaches[0]->allowedMax);
    }

    public function testHumidityBelowMinBreaches(): void
    {
        $breaches = $this->evaluator->evaluate(29.0, 50.0, 29.0, 3.0, 55.0, 2.0);

        self::assertCount(1, $breaches);
        self::assertSame(Breach::METRIC_HUMIDITY, $breaches[0]->metric);
    }

    public function testBothMetricsCanBreachAtOnce(): void
    {
        // Colombia: 26°C ±3 -> [23,29], 80% ±2 -> [78,82].
        $breaches = $this->evaluator->evaluate(35.0, 90.0, 26.0, 3.0, 80.0, 2.0);

        self::assertCount(2, $breaches);
    }

    public function testNullReadingsAreIgnored(): void
    {
        $breaches = $this->evaluator->evaluate(null, null, 31.0, 3.0, 60.0, 2.0);

        self::assertSame([], $breaches);
    }

    public function testEcuadorThresholdsBreachOnHighTemp(): void
    {
        // Ecuador: 31°C ±3 -> [28,34].
        $breaches = $this->evaluator->evaluate(34.5, 60.0, 31.0, 3.0, 60.0, 2.0);

        self::assertCount(1, $breaches);
        self::assertSame(Breach::METRIC_TEMPERATURE, $breaches[0]->metric);
    }

    public function testBatchIsStaleAfterOneYear(): void
    {
        $now = new \DateTimeImmutable('2026-07-08');
        $stored = new \DateTimeImmutable('2025-07-01'); // 372 days earlier

        self::assertTrue($this->evaluator->isBatchStale($stored, $now, 365));
    }

    public function testBatchWithinLimitIsNotStale(): void
    {
        $now = new \DateTimeImmutable('2026-07-08');
        $stored = new \DateTimeImmutable('2026-01-01'); // ~188 days

        self::assertFalse($this->evaluator->isBatchStale($stored, $now, 365));
    }

    public function testBatchExactlyAtLimitIsNotStale(): void
    {
        $now = new \DateTimeImmutable('2026-07-08');
        $stored = $now->sub(new \DateInterval('P365D'));

        self::assertFalse($this->evaluator->isBatchStale($stored, $now, 365));
    }

    public function testBreachDescriptionIsHuman(): void
    {
        $breach = new Breach(Breach::METRIC_TEMPERATURE, 33.0, 26.0, 32.0);

        self::assertStringContainsString('Temperature', $breach->describe());
        self::assertStringContainsString('°C', $breach->describe());
    }
}
