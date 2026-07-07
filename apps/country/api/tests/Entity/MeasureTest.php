<?php

namespace App\Tests\Entity;

use App\Entity\Measure;
use App\Entity\Sensor;
use PHPUnit\Framework\TestCase;

final class MeasureTest extends TestCase
{
    public function testTemperatureAndHumidityRoundTrip(): void
    {
        $measure = (new Measure())
            ->setTemperature(24.3)
            ->setHumidity(55.0);

        self::assertSame(24.3, $measure->getTemperature());
        self::assertSame(55.0, $measure->getHumidity());
    }

    public function testMeasuredAtIsPreserved(): void
    {
        $at = new \DateTimeImmutable('2026-07-08T10:00:00+00:00');
        $measure = (new Measure())->setMeasuredAt($at);

        self::assertSame($at, $measure->getMeasuredAt());
    }

    public function testSensorAssociation(): void
    {
        $sensor = new Sensor();
        $measure = (new Measure())->setSensor($sensor);

        self::assertSame($sensor, $measure->getSensor());
    }
}
