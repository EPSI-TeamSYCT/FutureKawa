<?php

namespace App\EventSubscriber;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

class ApiKeySubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Autowire('%env(COUNTRY_API_KEY)%')] private string $apiKey,
    ) {
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        // On ne protège que les routes de données de l'API
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $fournie = $request->headers->get('X-API-KEY', '');

        // Comparaison à temps constant (anti timing-attack)
        if ('' === $this->apiKey || !hash_equals($this->apiKey, $fournie)) {
            throw new UnauthorizedHttpException('X-API-KEY', 'Clé API manquante ou invalide.');
        }
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => ['onKernelRequest', 10]];
    }
}
