<?php

namespace App\Command;

use App\Entity\Country;
use App\Entity\Measure;
use App\Entity\Sensor;
use App\Entity\Warehouse;
use App\Repository\CountryRepository;
use App\Repository\SensorRepository;
use App\Repository\WarehouseRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;


#[AsCommand(name: 'app:db:seed', description: 'Insère des données de démonstration (pays, entrepôts, capteurs, mesures)')]
class SeedDatabaseCommand extends Command
{
    /** Ideal storage conditions per country (temp °C / humidity %), tolerances match the simulator. */
    private const PRESETS = [
        'brazil' => ['iso' => 'BR', 'temp' => 29.0, 'humidity' => 55.0],
        'ecuador' => ['iso' => 'EC', 'temp' => 31.0, 'humidity' => 60.0],
        'colombia' => ['iso' => 'CO', 'temp' => 26.0, 'humidity' => 80.0],
    ];

    private const DEFAULT_DEVICES = '[{"warehouse":"wh-01","hardware_id":"br-wh-01"},{"warehouse":"wh-02","hardware_id":"br-wh-02"}]';

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CountryRepository $countries,
        private readonly WarehouseRepository $warehouses,
        private readonly SensorRepository $sensors,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('country', null, InputOption::VALUE_REQUIRED, 'Nom du pays (défaut: env COUNTRY ou "brazil")')
            ->addOption('devices', null, InputOption::VALUE_REQUIRED, 'JSON des capteurs (défaut: env DEVICES)')
            ->addOption('measures', null, InputOption::VALUE_REQUIRED, 'Nb de mesures historiques fictives par capteur', '0')
            ->addOption('interval', null, InputOption::VALUE_REQUIRED, 'Espacement des mesures historiques, en secondes', '600');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $countryName = strtolower((string) ($input->getOption('country') ?: getenv('COUNTRY') ?: 'brazil'));
        $devicesJson = (string) ($input->getOption('devices') ?: getenv('DEVICES') ?: self::DEFAULT_DEVICES);
        $nbMeasures = max(0, (int) $input->getOption('measures'));
        $interval = max(1, (int) $input->getOption('interval'));

        $devices = json_decode($devicesJson, true);
        if (!is_array($devices) || [] === $devices) {
            $io->error('DEVICES invalide (JSON attendu : [{"warehouse":"wh-01","hardware_id":"br-wh-01"}, …]).');

            return Command::FAILURE;
        }

        $preset = self::PRESETS[$countryName] ?? ['iso' => strtoupper(substr($countryName, 0, 2)), 'temp' => 25.0, 'humidity' => 60.0];

        // --- Country (idempotent by ISO code) -------------------------------
        $country = $this->countries->findOneBy(['isoCode' => $preset['iso']]);
        if (!$country) {
            $country = (new Country())
                ->setName(ucfirst($countryName))
                ->setIsoCode($preset['iso'])
                ->setIdealTemp($preset['temp'])
                ->setIdealHumidity($preset['humidity'])
                ->setToleranceTemp(3.0)
                ->setToleranceHumidity(2.0);
            $this->em->persist($country);
            $io->writeln("• Pays créé : {$country->getName()} ({$preset['iso']})");
        } else {
            $io->writeln("• Pays existant réutilisé : {$country->getName()}");
        }

        $createdSensors = [];
        foreach ($devices as $device) {
            $warehouseName = (string) ($device['warehouse'] ?? 'wh-01');
            $hardwareId = (string) ($device['hardware_id'] ?? '');
            $model = (string) ($device['model'] ?? 'DHT11');

            if ('' === $hardwareId) {
                $io->warning('Device sans hardware_id ignoré.');
                continue;
            }

            // --- Warehouse (idempotent by name + country) -------------------
            $warehouse = $this->warehouses->findOneBy(['name' => $warehouseName, 'country' => $country]);
            if (!$warehouse) {
                $warehouse = (new Warehouse())->setName($warehouseName)->setCountry($country);
                $this->em->persist($warehouse);
                $io->writeln("  • Entrepôt créé : {$warehouseName}");
            }

            // --- Sensor (idempotent by hardwareId) --------------------------
            $sensor = $this->sensors->findOneBy(['hardwareId' => $hardwareId]);
            if (!$sensor) {
                $sensor = (new Sensor())
                    ->setHardwareId($hardwareId)
                    ->setModel($model)
                    ->setStatus('active')
                    ->setLastCom(new \DateTime())
                    ->setWarehouse($warehouse);
                $this->em->persist($sensor);
                $createdSensors[] = $sensor;
                $io->writeln("  • Capteur créé : {$hardwareId} ({$model})");
            } else {
                $io->writeln("  • Capteur existant : {$hardwareId}");
            }

            // --- Optional fake historical measures --------------------------
            if ($nbMeasures > 0) {
                $this->seedMeasures($sensor, $country, $nbMeasures, $interval);
                $io->writeln("    → {$nbMeasures} mesures fictives ajoutées");
            }
        }

        $this->em->flush();

        $io->success(sprintf(
            'Seed terminé : pays "%s", %d device(s), %d capteur(s) créé(s).',
            $countryName, count($devices), count($createdSensors)
        ));

        return Command::SUCCESS;
    }

    /** Generate N measurements going back in time, hovering around the ideal with occasional anomalies. */
    private function seedMeasures(Sensor $sensor, Country $country, int $count, int $interval): void
    {
        $now = time();
        for ($i = 0; $i < $count; ++$i) {
            $anomaly = 0 === random_int(0, 9); // ~10% anomalous, like the simulator
            $tempNoise = $anomaly ? random_int(4, 8) : random_int(-2, 2);
            $humNoise = $anomaly ? random_int(5, 12) : random_int(-3, 3);

            $measure = (new Measure())
                ->setTemperature((float) $country->getIdealTemp() + $tempNoise)
                ->setHumidity((float) $country->getIdealHumidity() + $humNoise)
                ->setMeasuredAt((new \DateTimeImmutable())->setTimestamp($now - $i * $interval))
                ->setSensor($sensor);
            $this->em->persist($measure);
        }
    }
}
