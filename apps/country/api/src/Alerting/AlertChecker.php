<?php

namespace App\Alerting;

use App\Entity\Alert;
use App\Entity\Batch;
use App\Entity\Country;
use App\Entity\Measure;
use App\Entity\Responsible;
use App\Repository\AlertRepository;
use App\Repository\BatchRepository;
use App\Repository\MeasureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

/**
 * Scans recent measures and stored batches, raises {@see Alert} rows for any
 * out-of-range reading or stale lot, and e-mails the country's responsible.
 *
 * Deduplication:
 *   - stale batch: one alert per batch, ever (a batch stays stale until moved);
 *   - out-of-range: at most one alert per warehouse + type within the cooldown
 *     window, so a still-open condition is not re-sent on every run.
 */
final class AlertChecker
{
    /** Only re-raise an out-of-range alert for a warehouse after this many hours. */
    private const OUT_OF_RANGE_COOLDOWN_HOURS = 24;

    private LoggerInterface $logger;

    public function __construct(
        private readonly MeasureRepository $measures,
        private readonly BatchRepository $batches,
        private readonly AlertRepository $alerts,
        private readonly CountryThresholdProvider $thresholds,
        private readonly ThresholdEvaluator $evaluator,
        private readonly AlertMailer $mailer,
        private readonly EntityManagerInterface $em,
        ?LoggerInterface $logger = null,
    ) {
        $this->logger = $logger ?? new NullLogger();
    }

    /**
     * Runs both checks and returns a summary of what happened.
     *
     * @param int $lookbackHours how far back to scan measures for out-of-range readings
     */
    public function run(int $lookbackHours, \DateTimeImmutable $now): AlertCheckReport
    {
        $report = new AlertCheckReport();

        $this->checkMeasures($lookbackHours, $now, $report);
        $this->checkBatches($now, $report);

        $this->em->flush();

        return $report;
    }

    private function checkMeasures(int $lookbackHours, \DateTimeImmutable $now, AlertCheckReport $report): void
    {
        $since = $now->sub(new \DateInterval(sprintf('PT%dH', max(1, $lookbackHours))));
        $cooldownStart = $now->sub(new \DateInterval(sprintf('PT%dH', self::OUT_OF_RANGE_COOLDOWN_HOURS)));

        foreach ($this->measures->findRecordedSince($since) as $measure) {
            $warehouse = $measure->getSensor()?->getWarehouse();
            $country = $warehouse?->getCountry();
            if (null === $warehouse || null === $country) {
                continue;
            }

            $t = $this->thresholds->forCountry($country);
            $breaches = $this->evaluator->evaluate(
                $measure->getTemperature(),
                $measure->getHumidity(),
                $t->idealTemp,
                $t->toleranceTemp,
                $t->idealHumidity,
                $t->toleranceHumidity,
            );

            if ([] === $breaches) {
                continue;
            }

            if ($this->alerts->hasRecentAlert($warehouse, AlertType::OUT_OF_RANGE, $cooldownStart)) {
                ++$report->outOfRangeSkipped;

                continue;
            }

            $alert = $this->buildOutOfRangeAlert($measure, $country, $breaches, $now);
            $this->em->persist($alert);
            ++$report->outOfRangeRaised;

            $this->notify($alert, $country, $report);
        }
    }

    private function checkBatches(\DateTimeImmutable $now, AlertCheckReport $report): void
    {
        $maxAgeDays = $this->thresholds->staleBatchMaxAgeDays();
        $threshold = $now->sub(new \DateInterval(sprintf('P%dD', $maxAgeDays)));

        foreach ($this->batches->findStoredBefore($threshold) as $batch) {
            $storageDate = $batch->getStorageDate();
            $warehouse = $batch->getWarehouse();
            $country = $warehouse?->getCountry();
            if (null === $storageDate || null === $warehouse || null === $country) {
                continue;
            }

            // Guard against boundary/off-by-one: confirm true staleness.
            if (!$this->evaluator->isBatchStale($storageDate, $now, $maxAgeDays)) {
                continue;
            }

            if ($this->alerts->hasOpenStaleBatchAlert($batch)) {
                ++$report->staleBatchSkipped;

                continue;
            }

            $alert = $this->buildStaleBatchAlert($batch, $storageDate, $now);
            $this->em->persist($alert);
            ++$report->staleBatchRaised;

            $this->notify($alert, $country, $report);
        }
    }

    /**
     * @param list<Breach> $breaches
     */
    private function buildOutOfRangeAlert(Measure $measure, Country $country, array $breaches, \DateTimeImmutable $now): Alert
    {
        $warehouse = $measure->getSensor()?->getWarehouse();
        $details = implode('; ', array_map(static fn (Breach $b) => $b->describe(), $breaches));

        $message = sprintf(
            'Out-of-range conditions in warehouse "%s" (%s): %s. Measured at %s.',
            $warehouse?->getName() ?? '?',
            $country->getName() ?? '?',
            $details,
            $measure->getMeasuredAt()?->format(\DateTimeInterface::ATOM) ?? '?',
        );

        return (new Alert())
            ->setType(AlertType::OUT_OF_RANGE)
            ->setMessage($message)
            ->setCreatedAt($now)
            ->setEmailSent(false)
            ->setWarehouse($warehouse);
    }

    private function buildStaleBatchAlert(Batch $batch, \DateTimeImmutable $storageDate, \DateTimeImmutable $now): Alert
    {
        $ageDays = $storageDate->diff($now)->days;

        $message = sprintf(
            'Stale batch "%s" stored for %d days (since %s) in warehouse "%s" — exceeds the %d-day limit.',
            $batch->getRef() ?? '?',
            $ageDays,
            $storageDate->format('Y-m-d'),
            $batch->getWarehouse()?->getName() ?? '?',
            $this->thresholds->staleBatchMaxAgeDays(),
        );

        return (new Alert())
            ->setType(AlertType::STALE_BATCH)
            ->setMessage($message)
            ->setCreatedAt($now)
            ->setEmailSent(false)
            ->setWarehouse($batch->getWarehouse())
            ->setBatch($batch);
    }

    private function notify(Alert $alert, Country $country, AlertCheckReport $report): void
    {
        $responsible = $this->firstResponsibleWithEmail($country);
        if (null === $responsible) {
            ++$report->emailsSkipped;
            $this->logger->warning('No responsible with an email for country {country}; alert stored but not e-mailed.', [
                'country' => $country->getName(),
            ]);

            return;
        }

        try {
            $this->mailer->send($alert, $responsible);
            $alert->setEmailSent(true);
            ++$report->emailsSent;
        } catch (\Throwable $e) {
            ++$report->emailsFailed;
            $this->logger->error('Failed to send alert email: {error}', ['error' => $e->getMessage()]);
        }
    }

    private function firstResponsibleWithEmail(Country $country): ?Responsible
    {
        foreach ($country->getResponsibles() as $responsible) {
            if (null !== $responsible->getEmail() && '' !== $responsible->getEmail()) {
                return $responsible;
            }
        }

        return null;
    }
}
