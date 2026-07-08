<?php

namespace App\Repository;

use App\Entity\Batch;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Batch>
 */
class BatchRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Batch::class);
    }

    /**
     * Batches whose storage date is on or before $threshold — i.e. stored for
     * longer than the allowed maximum age. Warehouse + country are eager-loaded
     * so the alert check can address the responsible without extra queries.
     *
     * @return list<Batch>
     */
    public function findStoredBefore(\DateTimeImmutable $threshold): array
    {
        /** @var list<Batch> $result */
        $result = $this->createQueryBuilder('b')
            ->addSelect('w', 'c')
            ->join('b.warehouse', 'w')
            ->join('w.country', 'c')
            ->andWhere('b.storageDate <= :threshold')
            ->setParameter('threshold', $threshold)
            ->orderBy('b.storageDate', 'ASC')
            ->getQuery()
            ->getResult();

        return $result;
    }
}
