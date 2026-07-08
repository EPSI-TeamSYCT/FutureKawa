<?php

namespace App\Controller\Admin;

use App\Entity\Sensor;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class SensorCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Sensor::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnIndex();
        yield TextField::new('hardwareId');
        yield TextField::new('model');
        yield TextField::new('status');
        yield DateTimeField::new('lastCom')->hideWhenCreating();
        yield AssociationField::new('warehouse');
    }
}
