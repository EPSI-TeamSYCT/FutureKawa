<?php

namespace App\Command;

use App\Alerting\AlertChecker;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Scans recent measures + stored batches, raises alerts for out-of-range
 * readings and stale lots, and e-mails the country's responsible.
 *
 * Meant to run on a schedule (e.g. hourly cron). Idempotent: an already-open
 * condition is not re-raised or re-e-mailed on the next run.
 */
#[AsCommand(
    name: 'app:alerts:check',
    description: 'Detect out-of-range measures and stale batches, raise alerts and notify responsibles',
)]
final class CheckAlertsCommand extends Command
{
    public function __construct(private readonly AlertChecker $checker)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'lookback-hours',
            null,
            InputOption::VALUE_REQUIRED,
            'How many hours of recent measures to scan for out-of-range readings',
            '24',
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $lookback = (int) $input->getOption('lookback-hours');
        $report = $this->checker->run($lookback, new \DateTimeImmutable());

        $io->section('Alert check summary');
        $io->table(
            ['Metric', 'Count'],
            [
                ['Out-of-range alerts raised', (string) $report->outOfRangeRaised],
                ['Out-of-range skipped (cooldown)', (string) $report->outOfRangeSkipped],
                ['Stale-batch alerts raised', (string) $report->staleBatchRaised],
                ['Stale-batch skipped (existing)', (string) $report->staleBatchSkipped],
                ['Emails sent', (string) $report->emailsSent],
                ['Emails failed', (string) $report->emailsFailed],
                ['Emails skipped (no responsible)', (string) $report->emailsSkipped],
            ],
        );

        $io->success(sprintf('%d alert(s) raised.', $report->totalRaised()));

        return Command::SUCCESS;
    }
}
