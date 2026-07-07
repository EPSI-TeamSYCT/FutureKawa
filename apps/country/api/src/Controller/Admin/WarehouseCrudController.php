<?php

namespace App\Controller\Admin;

use App\Entity\Warehouse;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class WarehouseCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Warehouse::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnIndex();
        yield TextField::new('name');
        yield AssociationField::new('country');
    }
}
