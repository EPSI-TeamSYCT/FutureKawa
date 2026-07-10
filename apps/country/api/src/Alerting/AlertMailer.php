<?php

namespace App\Alerting;

use App\Entity\Alert;
use App\Entity\Responsible;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * Sends alert e-mails to a country's responsible d'exploitation.
 *
 * Uses Symfony Mailer with MAILER_DSN from the environment (default
 * "null://null" so demos and CI run without a real SMTP server).
 */
final class AlertMailer
{
    public function __construct(
        private readonly MailerInterface $mailer,
        #[Autowire('%env(ALERT_MAIL_FROM)%')] private readonly string $from,
    ) {
    }

    /**
     * @throws TransportExceptionInterface
     */
    public function send(Alert $alert, Responsible $responsible): void
    {
        $country = $responsible->getCountry()?->getName() ?? 'unknown country';
        $warehouse = $alert->getWarehouse()?->getName() ?? 'unknown warehouse';

        $subject = match ($alert->getType()) {
            AlertType::STALE_BATCH => sprintf('[FutureKawa] Stale batch alert — %s', $country),
            default => sprintf('[FutureKawa] Out-of-range alert — %s / %s', $country, $warehouse),
        };

        $body = sprintf(
            "Hello %s,\n\n%s\n\nCountry: %s\nWarehouse: %s\nRaised at: %s\n\n"
            .'-- FutureKawa automated monitoring',
            $responsible->getName() ?? 'responsible',
            $alert->getMessage(),
            $country,
            $warehouse,
            $alert->getCreatedAt()?->format(\DateTimeInterface::ATOM) ?? '',
        );

        $email = (new Email())
            ->from($this->from)
            ->to((string) $responsible->getEmail())
            ->subject($subject)
            ->text($body);

        $this->mailer->send($email);
    }
}
