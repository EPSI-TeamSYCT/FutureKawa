# Postgres 16 pour la BDD de test de l'API country
FROM postgres:16-alpine

# Réglages par défaut (surchargés par le docker-compose)
ENV POSTGRES_USER=app \
    POSTGRES_PASSWORD=!ChangeMe! \
    POSTGRES_DB=app

# Tout fichier .sql/.sh placé ici est exécuté au 1er démarrage (base vide)
COPY init/ /docker-entrypoint-initdb.d/

EXPOSE 5432
