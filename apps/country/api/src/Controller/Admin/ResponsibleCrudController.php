<?php

namespace App\Controller\Admin;

use App\Entity\Responsible;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\EmailField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class ResponsibleCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Responsible::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnIndex();
        yield TextField::new('name');
        yield EmailField::new('email');
        yield AssociationField::new('country');
    }
}
