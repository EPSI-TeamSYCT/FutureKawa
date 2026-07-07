<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:create-admin', description: 'Crée (ou met à jour) un utilisateur ROLE_ADMIN pour le back-office')]
class CreateAdminCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::OPTIONAL, 'Adresse e-mail de connexion')
            ->addArgument('password', InputArgument::OPTIONAL, 'Mot de passe en clair');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = $input->getArgument('email') ?? $io->ask('Email');
        $password = $input->getArgument('password') ?? $io->askHidden('Mot de passe');

        if (!$email || !$password) {
            $io->error('Email et mot de passe sont requis.');

            return Command::FAILURE;
        }

        // Update the password if the user already exists, otherwise create it.
        $user = $this->users->findOneBy(['email' => $email]) ?? new User();
        $user->setEmail($email);
        $user->setRoles(['ROLE_ADMIN']);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));

        $this->em->persist($user);
        $this->em->flush();

        $io->success(sprintf('Administrateur "%s" enregistré (ROLE_ADMIN).', $email));

        return Command::SUCCESS;
    }
}
