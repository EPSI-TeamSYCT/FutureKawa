<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\SensorRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource]
#[ORM\Entity(repositoryClass: SensorRepository::class)]
class Sensor
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $hardwareId = null;

    #[ORM\Column(length: 255)]
    private ?string $model = null;

    #[ORM\Column(length: 255)]
    private ?string $status = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTime $lastCom = null;

    #[ORM\ManyToOne(inversedBy: 'sensors')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Warehouse $warehouse = null;

    /**
     * @var Collection<int, Measure>
     */
    #[ORM\OneToMany(targetEntity: Measure::class, mappedBy: 'sensor')]
    private Collection $measures;

    public function __construct()
    {
        $this->measures = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function __toString(): string
    {
        return $this->hardwareId ?? '';
    }

    public function getHardwareId(): ?string
    {
        return $this->hardwareId;
    }

    public function setHardwareId(string $hardwareId): static
    {
        $this->hardwareId = $hardwareId;

        return $this;
    }

    public function getModel(): ?string
    {
        return $this->model;
    }

    public function setModel(string $model): static
    {
        $this->model = $model;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getLastCom(): ?\DateTime
    {
        return $this->lastCom;
    }

    public function setLastCom(\DateTime $lastCom): static
    {
        $this->lastCom = $lastCom;

        return $this;
    }

    public function getWarehouse(): ?Warehouse
    {
        return $this->warehouse;
    }

    public function setWarehouse(?Warehouse $warehouse): static
    {
        $this->warehouse = $warehouse;

        return $this;
    }

    /**
     * @return Collection<int, Measure>
     */
    public function getMeasures(): Collection
    {
        return $this->measures;
    }

    public function addMeasure(Measure $measure): static
    {
        if (!$this->measures->contains($measure)) {
            $this->measures->add($measure);
            $measure->setSensor($this);
        }

        return $this;
    }

    public function removeMeasure(Measure $measure): static
    {
        if ($this->measures->removeElement($measure) && $measure->getSensor() === $this) {
            // set the owning side to null (unless already changed)
            $measure->setSensor(null);
        }

        return $this;
    }
}
