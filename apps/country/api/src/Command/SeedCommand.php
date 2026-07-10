<?php

namespace App\Command;

use App\Entity\Batch;
use App\Entity\Country;
use App\Entity\Exploitation;
use App\Entity\Responsible;
use App\Entity\Sensor;
use App\Entity\Warehouse;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(name: 'app:seed', description: 'Seed demo data for the country given by the COUNTRY env')]
class SeedCommand extends Command
{
    /**
     * Fixed reference date: storage dates are computed relative to it so the
     * generated demo data is deterministic (no dependency on the current time).
     */
    private const string REFERENCE_DATE = '2026-07-01';

    /**
     * Sensors are the real ESP8266 + DHT11 stack used by the IoT simulator.
     */
    private const string SENSOR_MODEL = 'DHT11';

    /**
     * Per-warehouse lots. The AGED lot is stored > 365 days before the
     * reference date so the ">365 days" business rule fires on it; the others
     * stay well inside the window. `status` is a free-form string on Batch.
     *
     * @var list<array{status: string, offsetDays: int}>
     */
    private const array LOTS = [
        ['status' => 'fresh', 'offsetDays' => 60],
        ['status' => 'aged', 'offsetDays' => 400],
        ['status' => 'shipped', 'offsetDays' => 120],
    ];

    /**
     * Authoritative demo dataset per country (names reused from the frontend).
     * `hardwareId` MUST match the IoT simulator so the ingest worker can attach
     * live measures to the seeded sensors.
     *
     * @var array<string, array{
     *     name: string,
     *     isoCode: string,
     *     idealTemp: float,
     *     idealHumidity: float,
     *     toleranceTemp: float,
     *     toleranceHumidity: float,
     *     responsible: array{name: string, email: string},
     *     exploitations: list<string>,
     *     warehouses: list<array{name: string, code: string, hardwareId: string}>,
     * }>
     */
    private const array DATASETS = [
        'brazil' => [
            'name' => 'Brazil',
            'isoCode' => 'BR',
            'idealTemp' => 29.0,
            'idealHumidity' => 55.0,
            'toleranceTemp' => 3.0,
            'toleranceHumidity' => 2.0,
            'responsible' => ['name' => 'Ana Costa', 'email' => 'ana.costa@futurekawa.example'],
            'exploitations' => ['Fazenda Santa Bárbara', 'Fazenda Boa Esperança'],
            'warehouses' => [
                ['name' => 'Santos-01', 'code' => 'SAN', 'hardwareId' => 'br-san-01'],
                ['name' => 'Varginha-02', 'code' => 'VAR', 'hardwareId' => 'br-var-02'],
            ],
        ],
        'ecuador' => [
            'name' => 'Ecuador',
            'isoCode' => 'EC',
            'idealTemp' => 31.0,
            'idealHumidity' => 60.0,
            'toleranceTemp' => 3.0,
            'toleranceHumidity' => 2.0,
            'responsible' => ['name' => 'Luis Andrade', 'email' => 'luis.andrade@futurekawa.example'],
            'exploitations' => ['Hacienda La Emilia', 'Finca El Vergel'],
            'warehouses' => [
                ['name' => 'Guayaquil-02', 'code' => 'GUA', 'hardwareId' => 'ec-gua-02'],
                ['name' => 'Manta-01', 'code' => 'MAN', 'hardwareId' => 'ec-man-01'],
            ],
        ],
        'colombia' => [
            'name' => 'Colombia',
            'isoCode' => 'CO',
            'idealTemp' => 26.0,
            'idealHumidity' => 80.0,
            'toleranceTemp' => 3.0,
            'toleranceHumidity' => 2.0,
            'responsible' => ['name' => 'María Restrepo', 'email' => 'maria.restrepo@futurekawa.example'],
            'exploitations' => ['Hacienda La Esperanza', 'Finca El Roble'],
            'warehouses' => [
                ['name' => 'Medellín-01', 'code' => 'MED', 'hardwareId' => 'co-med-01'],
                ['name' => 'Bogotá-01', 'code' => 'BOG', 'hardwareId' => 'co-bog-01'],
            ],
        ],
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        #[Autowire('%env(COUNTRY)%')] private readonly string $country,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // Idempotency: each per-country database holds exactly one Country row,
        // so its presence means the demo data is already there.
        if ($this->em->getRepository(Country::class)->count([]) > 0) {
            $io->warning('Country already seeded — nothing to do.');

            return Command::SUCCESS;
        }

        $key = strtolower(trim($this->country));
        $dataset = self::DATASETS[$key] ?? null;

        if (null === $dataset) {
            $io->error(sprintf(
                'Unknown COUNTRY "%s" (expected one of: %s).',
                $this->country,
                implode(', ', array_keys(self::DATASETS)),
            ));

            return Command::FAILURE;
        }

        $connection = $this->em->getConnection();
        $connection->beginTransaction();

        try {
            $this->seed($dataset);
            $this->em->flush();
            $connection->commit();
        } catch (\Throwable $e) {
            $connection->rollBack();
            $io->error(sprintf('Seeding failed, rolled back: %s', $e->getMessage()));

            return Command::FAILURE;
        }

        $io->success(sprintf(
            'Seeded "%s": 1 country, 1 responsible, %d exploitations, %d warehouses, %d sensors, %d batches.',
            $dataset['name'],
            \count($dataset['exploitations']),
            \count($dataset['warehouses']),
            \count($dataset['warehouses']),
            \count($dataset['warehouses']) * \count(self::LOTS),
        ));

        return Command::SUCCESS;
    }

    /**
     * Builds and persists the full object graph for one country.
     * The caller owns the transaction and the single flush.
     *
     * @param array{
     *     name: string,
     *     isoCode: string,
     *     idealTemp: float,
     *     idealHumidity: float,
     *     toleranceTemp: float,
     *     toleranceHumidity: float,
     *     responsible: array{name: string, email: string},
     *     exploitations: list<string>,
     *     warehouses: list<array{name: string, code: string, hardwareId: string}>,
     * } $dataset
     */
    private function seed(array $dataset): void
    {
        $referenceDate = new \DateTimeImmutable(self::REFERENCE_DATE);

        $country = (new Country())
            ->setName($dataset['name'])
            ->setIsoCode($dataset['isoCode'])
            ->setIdealTemp($dataset['idealTemp'])
            ->setIdealHumidity($dataset['idealHumidity'])
            ->setToleranceTemp($dataset['toleranceTemp'])
            ->setToleranceHumidity($dataset['toleranceHumidity']);
        $this->em->persist($country);

        $responsible = (new Responsible())
            ->setName($dataset['responsible']['name'])
            ->setEmail($dataset['responsible']['email'])
            ->setCountry($country);
        $this->em->persist($responsible);

        /** @var list<Exploitation> $exploitations */
        $exploitations = [];
        foreach ($dataset['exploitations'] as $name) {
            $exploitation = (new Exploitation())
                ->setName($name)
                ->setCountry($country);
            $this->em->persist($exploitation);
            $exploitations[] = $exploitation;
        }

        foreach ($dataset['warehouses'] as $whIndex => $wh) {
            $warehouse = (new Warehouse())
                ->setName($wh['name'])
                ->setCountry($country);
            $this->em->persist($warehouse);

            $sensor = (new Sensor())
                ->setHardwareId($wh['hardwareId'])
                ->setModel(self::SENSOR_MODEL)
                ->setStatus('active')
                ->setLastCom(new \DateTime(self::REFERENCE_DATE))
                ->setWarehouse($warehouse);
            $this->em->persist($sensor);

            // Deterministic per-warehouse batch reference: <ISO>-<CODE>-<year>-<seq>.
            $baseSeq = ($whIndex + 1) * 100 + 40;
            $exploitation = $exploitations[$whIndex % \count($exploitations)];

            foreach (self::LOTS as $lotIndex => $lot) {
                $ref = sprintf('%s-%s-%d-%04d', $dataset['isoCode'], $wh['code'], 2025, $baseSeq + $lotIndex);

                $batch = (new Batch())
                    ->setRef($ref)
                    ->setStorageDate($referenceDate->sub(new \DateInterval(sprintf('P%dD', $lot['offsetDays']))))
                    ->setStatus($lot['status'])
                    ->setWarehouse($warehouse)
                    ->setExploitation($exploitation);
                $this->em->persist($batch);
            }
        }
    }
}
