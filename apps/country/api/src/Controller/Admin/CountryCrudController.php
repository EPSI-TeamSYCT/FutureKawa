<?php

namespace App\Controller\Admin;

use App\Entity\Country;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class CountryCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Country::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id')->onlyOnIndex();
        yield TextField::new('name');
        yield TextField::new('isoCode');
        yield NumberField::new('idealTemp')->setNumDecimals(1);
        yield NumberField::new('idealHumidity')->setNumDecimals(1);
        yield NumberField::new('toleranceTemp')->setNumDecimals(1);
        yield NumberField::new('toleranceHumidity')->setNumDecimals(1);
    }
}
