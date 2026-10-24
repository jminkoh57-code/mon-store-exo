# mon-store-exo

Application de todos en MERN, avec une file BullMQ pour les images.

<p align="center">
  <img src="https://media.giphy.com/media/3o7TKu8Xj5cBq9p0pi/giphy.gif" alt="Démo de l'application" width="700">
</p>

## Dossiers

- `frontend/` : React, Vite, Zustand. Nginx sert le build et proxy `/api` et `/storage`.
- `backend/` : API Express et worker BullMQ. MongoDB stocke les comptes et les tâches. MinIO stocke les images.

## Lancer

```bash
docker compose up --build
```

- Application : http://localhost:8080
- Données MongoDB : http://localhost:8081

Les comptes MySQL ne sont pas repris : MongoDB part d'une base vide.

## BullMQ

L'API ne parle pas à MinIO. Elle dépose un job dans Redis :

- `upload` : le worker enregistre l'image, puis l'API répond avec son URL.
- `delete` : le worker supprime l'image après un remplacement ou une suppression de tâche.

## Secrets

`JWT_SECRET` a une valeur de développement si elle est absente. Pour réutiliser le coffre Bitwarden :

```bash
./scripts/bitwarden.sh compose up --build
```

Le script n'exige plus que `JWT_SECRET`. Les identifiants MinIO restent facultatifs.
