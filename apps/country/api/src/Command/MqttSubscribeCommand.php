<?php

namespace App\Command;

use App\Entity\Measure;
use App\Repository\SensorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;
use PhpMqtt\Client\ConnectionSettings;
use PhpMqtt\Client\MqttClient;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(name: 'app:mqtt:subscribe', description: 'Écoute le broker et enregistre les mesures')]
class MqttSubscribeCommand extends Command
{
    private MqttClient $mqtt;

    public function __construct(
        private readonly ManagerRegistry $doctrine,
        private readonly SensorRepository $sensor,
        #[Autowire('%env(MQTT_HOST)%')] private readonly string $host,
        #[Autowire('%env(int:MQTT_PORT)%')] private readonly int $port,
        #[Autowire('%env(MQTT_USER)%')] private readonly string $user,
        #[Autowire('%env(MQTT_PASSWORD)%')] private readonly string $password,
        #[Autowire('%env(COUNTRY)%')] private readonly string $country,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // (1) Connexion : identifiants + "testament" si le worker meurt.
        // Un env vide (broker sans auth) doit passer null : php-mqtt refuse une
        // chaîne vide (« username may not consist of white space only »).
        $settings = (new ConnectionSettings())
            ->setUsername('' !== $this->user ? $this->user : null)
            ->setPassword('' !== $this->password ? $this->password : null)
            ->setKeepAliveInterval(60)
            ->setLastWillTopic("futurekawa/{$this->country}/worker/status")
            ->setLastWillMessage('offline')
            ->setLastWillQualityOfService(1);

        $this->mqtt = new MqttClient($this->host, $this->port, "worker-ingestion-{$this->country}");
        $this->mqtt->connect($settings, true);
        $io->success("Connecté au broker {$this->host}:{$this->port}");

        // (2) Arrêt propre sur Ctrl+C / docker stop
        if (function_exists('pcntl_async_signals')) {
            pcntl_async_signals(true);
            $stop = fn () => $this->mqtt->interrupt();
            pcntl_signal(SIGINT, $stop);
            pcntl_signal(SIGTERM, $stop);
        }

        // (3) Abonnement : le callback tourne à CHAQUE message reçu
        $this->mqtt->subscribe(
            "futurekawa/{$this->country}/+/measurements",
            fn (string $topic, string $message) => $this->traiter($message, $io),
            1
        );
        $io->writeln('En écoute des mesures…');

        // (4) La boucle qui garde le worker en vie
        $this->mqtt->loop(true);

        $this->mqtt->disconnect();

        return Command::SUCCESS;
    }

    private function traiter(string $message, SymfonyStyle $io): void
    {
        $data = json_decode($message, true);

        // Validation alignée sur le contrat MQTT
        if (!is_array($data) || !isset(
            $data['hardware_id'], $data['temperature'], $data['humidity'], $data['timestamp']
        )) {
            $io->warning('Message ignoré (invalide)');

            return;
        }

        $em = $this->doctrine->getManager();
        \assert($em instanceof EntityManagerInterface); // corrige "isOpen() undefined"
        if (!$em->isOpen()) {
            $this->doctrine->resetManager();
            $em = $this->doctrine->getManager();
            \assert($em instanceof EntityManagerInterface);
        }

        try {
            $capteur = $this->sensor->findOneBy(['hardwareId' => $data['hardware_id']]); // hardwareId, pas hardwareID
            if (!$capteur) {
                $io->warning("Capteur inconnu : {$data['hardware_id']}");

                return;
            }

            $mesure = (new Measure())
                ->setTemperature((float) $data['temperature'])
                ->setHumidity((float) $data['humidity'])
                ->setMeasuredAt((new \DateTimeImmutable())->setTimestamp((int) $data['timestamp']))
                ->setSensor($capteur);

            $capteur->setLastCom(new \DateTime());

            $em->persist($mesure);
            $em->flush();
            $em->clear();

            $io->writeln(sprintf('✓ %s : %.1f°C / %.0f%%',
                $data['hardware_id'], $data['temperature'], $data['humidity']));
        } catch (\Throwable $e) {
            $io->error('Erreur : '.$e->getMessage());
            $this->doctrine->getConnection()->close();
        }
    }
}
