<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\CountryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource]
#[ORM\Entity(repositoryClass: CountryRepository::class)]
class Country
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    private ?string $isoCode = null;

    #[ORM\Column]
    private ?float $idealTemp = null;

    #[ORM\Column]
    private ?float $idealHumidity = null;

    #[ORM\Column]
    private ?float $toleranceTemp = null;

    #[ORM\Column]
    private ?float $toleranceHumidity = null;

    /**
     * @var Collection<int, Exploitation>
     */
    #[ORM\OneToMany(targetEntity: Exploitation::class, mappedBy: 'country', orphanRemoval: true)]
    private Collection $exploitations;

    /**
     * @var Collection<int, Responsible>
     */
    #[ORM\OneToMany(targetEntity: Responsible::class, mappedBy: 'country')]
    private Collection $responsibles;

    /**
     * @var Collection<int, Warehouse>
     */
    #[ORM\OneToMany(targetEntity: Warehouse::class, mappedBy: 'country')]
    private Collection $warehouses;

    public function __construct()
    {
        $this->exploitations = new ArrayCollection();
        $this->responsibles = new ArrayCollection();
        $this->warehouses = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getIsoCode(): ?string
    {
        return $this->isoCode;
    }

    public function setIsoCode(string $isoCode): static
    {
        $this->isoCode = $isoCode;

        return $this;
    }

    public function getIdealTemp(): ?float
    {
        return $this->idealTemp;
    }

    public function setIdealTemp(float $idealTemp): static
    {
        $this->idealTemp = $idealTemp;

        return $this;
    }

    public function getIdealHumidity(): ?float
    {
        return $this->idealHumidity;
    }

    public function setIdealHumidity(float $idealHumidity): static
    {
        $this->idealHumidity = $idealHumidity;

        return $this;
    }

    public function getToleranceTemp(): ?float
    {
        return $this->toleranceTemp;
    }

    public function setToleranceTemp(float $toleranceTemp): static
    {
        $this->toleranceTemp = $toleranceTemp;

        return $this;
    }

    public function getToleranceHumidity(): ?float
    {
        return $this->toleranceHumidity;
    }

    public function setToleranceHumidity(float $toleranceHumidity): static
    {
        $this->toleranceHumidity = $toleranceHumidity;

        return $this;
    }

    /**
     * @return Collection<int, Exploitation>
     */
    public function getExploitations(): Collection
    {
        return $this->exploitations;
    }

    public function addExploitation(Exploitation $exploitation): static
    {
        if (!$this->exploitations->contains($exploitation)) {
            $this->exploitations->add($exploitation);
            $exploitation->setCountry($this);
        }

        return $this;
    }

    public function removeExploitation(Exploitation $exploitation): static
    {
        if ($this->exploitations->removeElement($exploitation)) {
            // set the owning side to null (unless already changed)
            if ($exploitation->getCountry() === $this) {
                $exploitation->setCountry(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Responsible>
     */
    public function getResponsibles(): Collection
    {
        return $this->responsibles;
    }

    public function addResponsible(Responsible $responsible): static
    {
        if (!$this->responsibles->contains($responsible)) {
            $this->responsibles->add($responsible);
            $responsible->setCountry($this);
        }

        return $this;
    }

    public function removeResponsible(Responsible $responsible): static
    {
        if ($this->responsibles->removeElement($responsible)) {
            // set the owning side to null (unless already changed)
            if ($responsible->getCountry() === $this) {
                $responsible->setCountry(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Warehouse>
     */
    public function getWarehouses(): Collection
    {
        return $this->warehouses;
    }

    public function addWarehouse(Warehouse $warehouse): static
    {
        if (!$this->warehouses->contains($warehouse)) {
            $this->warehouses->add($warehouse);
            $warehouse->setCountry($this);
        }

        return $this;
    }

    public function removeWarehouse(Warehouse $warehouse): static
    {
        if ($this->warehouses->removeElement($warehouse)) {
            // set the owning side to null (unless already changed)
            if ($warehouse->getCountry() === $this) {
                $warehouse->setCountry(null);
            }
        }

        return $this;
    }
}
