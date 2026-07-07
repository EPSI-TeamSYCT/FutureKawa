<?php

namespace App\Controller\Admin;

use App\Entity\Measure;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;

class MeasureCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Measure::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnIndex();
        yield NumberField::new('temperature')->setNumDecimals(1);
        yield NumberField::new('humidity')->setNumDecimals(1);
        yield DateTimeField::new('measuredAt');
        yield AssociationField::new('sensor');
    }
}
