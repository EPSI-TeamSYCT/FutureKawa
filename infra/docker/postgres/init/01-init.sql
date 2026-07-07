-- Optionnel : ce fichier ne s'exécute qu'au tout premier démarrage (volume vide).
-- En principe, c'est Doctrine qui crée le schéma via :
--   php bin/console doctrine:migrations:migrate
-- On se contente d'activer une extension utile.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
