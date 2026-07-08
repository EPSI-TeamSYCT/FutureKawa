<?php

namespace App\Controller\Admin;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\Response;

#[AdminDashboard(routePath: '/admin', routeName: 'admin')]
class DashboardController extends AbstractDashboardController
{
    public function __construct(
        private readonly AdminUrlGenerator $adminUrlGenerator,
    ) {
    }

    public function index(): Response
    {
        // Land on a real CRUD page instead of the default EasyAdmin welcome screen.
        $url = $this->adminUrlGenerator
            ->setController(CountryCrudController::class)
            ->generateUrl();

        return $this->redirect($url);
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('FutureKawa — Country API');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Dashboard', 'fa fa-home');

        yield MenuItem::section('Geography');
        yield MenuItem::linkTo(CountryCrudController::class, 'Countries', 'fa fa-globe');
        yield MenuItem::linkTo(ExploitationCrudController::class, 'Exploitations', 'fa fa-seedling');
        yield MenuItem::linkTo(WarehouseCrudController::class, 'Warehouses', 'fa fa-warehouse');
        yield MenuItem::linkTo(BatchCrudController::class, 'Batches', 'fa fa-boxes-stacked');

        yield MenuItem::section('IoT');
        yield MenuItem::linkTo(SensorCrudController::class, 'Sensors', 'fa fa-microchip');
        yield MenuItem::linkTo(MeasureCrudController::class, 'Measures', 'fa fa-temperature-half');
        yield MenuItem::linkTo(AlertCrudController::class, 'Alerts', 'fa fa-triangle-exclamation');

        yield MenuItem::section('People');
        yield MenuItem::linkTo(ResponsibleCrudController::class, 'Responsibles', 'fa fa-user-tie');
        yield MenuItem::linkTo(UserCrudController::class, 'Users', 'fa fa-users');
    }
}
