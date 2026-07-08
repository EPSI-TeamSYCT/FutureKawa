<?php

namespace App\Repository;

use App\Entity\Alert;
use App\Entity\Batch;
use App\Entity\Warehouse;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Alert>
 */
class AlertRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Alert::class);
    }

    /**
     * True when a stale-batch alert already exists for this batch, so we never
     * re-raise it for the same still-stored lot.
     */
    public function hasOpenStaleBatchAlert(Batch $batch): bool
    {
        return (bool) $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->andWhere('a.batch = :batch')
            ->andWhere('a.type = :type')
            ->setParameter('batch', $batch)
            ->setParameter('type', \App\Alerting\AlertType::STALE_BATCH)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * True when an out-of-range alert of the given type was already raised for
     * this warehouse since $since, so we don't spam a still-open condition.
     */
    public function hasRecentAlert(Warehouse $warehouse, string $type, \DateTimeImmutable $since): bool
    {
        return (bool) $this->createQueryBuilder('a')
            ->select('COUNT(a.id)')
            ->andWhere('a.warehouse = :warehouse')
            ->andWhere('a.type = :type')
            ->andWhere('a.createdAt >= :since')
            ->setParameter('warehouse', $warehouse)
            ->setParameter('type', $type)
            ->setParameter('since', $since)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
