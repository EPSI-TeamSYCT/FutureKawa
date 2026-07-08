<?php

namespace App\Alerting;

/**
 * Mutable tally of what an {@see AlertChecker} run did, for command output/logs.
 */
final class AlertCheckReport
{
    public int $outOfRangeRaised = 0;
    public int $outOfRangeSkipped = 0;
    public int $staleBatchRaised = 0;
    public int $staleBatchSkipped = 0;
    public int $emailsSent = 0;
    public int $emailsFailed = 0;
    public int $emailsSkipped = 0;

    public function totalRaised(): int
    {
        return $this->outOfRangeRaised + $this->staleBatchRaised;
    }
}
