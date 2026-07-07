<?php

namespace App\Controller\Admin;

use App\Entity\Batch;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class BatchCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Batch::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnIndex();
        yield TextField::new('ref');
        yield DateField::new('storageDate');
        yield TextField::new('status');
        yield AssociationField::new('exploitation');
        yield AssociationField::new('warehouse');
    }
}
