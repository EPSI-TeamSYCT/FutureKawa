<?php

namespace App\Tests\Alerting;

use App\Alerting\CountryThresholdProvider;
use App\Entity\Country;
use PHPUnit\Framework\TestCase;

final class CountryThresholdProviderTest extends TestCase
{
    private CountryThresholdProvider $provider;

    protected function setUp(): void
    {
        $this->provider = new CountryThresholdProvider();
    }

    public function testUsesEntityValuesWhenProvided(): void
    {
        $country = (new Country())
            ->setName('Brazil')
            ->setIsoCode('BR')
            ->setIdealTemp(30.0)
            ->setToleranceTemp(4.0)
            ->setIdealHumidity(58.0)
            ->setToleranceHumidity(5.0);

        $t = $this->provider->forCountry($country);

        self::assertSame(30.0, $t->idealTemp);
        self::assertSame(4.0, $t->toleranceTemp);
        self::assertSame(58.0, $t->idealHumidity);
        self::assertSame(5.0, $t->toleranceHumidity);
    }

    public function testFallsBackToBriefDefaultsByIso(): void
    {
        $country = (new Country())
            ->setName('Ecuador')
            ->setIsoCode('EC')
            ->setIdealTemp(0.0)
            ->setToleranceTemp(0.0)
            ->setIdealHumidity(0.0)
            ->setToleranceHumidity(0.0);

        $t = $this->provider->forCountry($country);

        // Ecuador 31°C / 60%, shared tolerances ±3 / ±2.
        self::assertSame(31.0, $t->idealTemp);
        self::assertSame(3.0, $t->toleranceTemp);
        self::assertSame(60.0, $t->idealHumidity);
        self::assertSame(2.0, $t->toleranceHumidity);
    }

    public function testColombiaDefaults(): void
    {
        $country = (new Country())
            ->setName('Colombia')
            ->setIsoCode('CO')
            ->setIdealTemp(0.0)
            ->setToleranceTemp(0.0)
            ->setIdealHumidity(0.0)
            ->setToleranceHumidity(0.0);

        $t = $this->provider->forCountry($country);

        self::assertSame(26.0, $t->idealTemp);
        self::assertSame(80.0, $t->idealHumidity);
    }

    public function testStaleBatchMaxAgeIsOneYear(): void
    {
        self::assertSame(365, $this->provider->staleBatchMaxAgeDays());
    }
}
