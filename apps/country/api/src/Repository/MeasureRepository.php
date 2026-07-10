<?php

namespace App\Repository;

use App\Entity\Measure;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Measure>
 */
class MeasureRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Measure::class);
    }

    /**
     * Measures recorded on or after $since, with sensor → warehouse → country
     * eager-loaded so the alert check can evaluate thresholds without N+1 queries.
     *
     * @return list<Measure>
     */
    public function findRecordedSince(\DateTimeImmutable $since): array
    {
        /** @var list<Measure> $result */
        $result = $this->createQueryBuilder('m')
            ->addSelect('s', 'w', 'c')
            ->join('m.sensor', 's')
            ->join('s.warehouse', 'w')
            ->join('w.country', 'c')
            ->andWhere('m.measuredAt >= :since')
            ->setParameter('since', $since)
            ->orderBy('m.measuredAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $result;
    }
}
