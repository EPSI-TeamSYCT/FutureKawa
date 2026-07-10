<?php

namespace App\Alerting;

/**
 * Canonical values stored in Alert::$type.
 */
final class AlertType
{
    /** A measure left the country's ideal temperature/humidity band. */
    public const OUT_OF_RANGE = 'out_of_range';

    /** A batch has been stored for longer than the allowed maximum age. */
    public const STALE_BATCH = 'stale_batch';
}
