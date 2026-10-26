# mon-store-exo

Application de todos en MERN, avec une file BullMQ pour les images.

<p align="center">
  <img src="https://media.giphy.com/media/3o7TKu8Xj5cBq9p0pi/giphy.gif" alt="Démo de l'application" width="700">
</p>

## Dossiers

- `frontend/` : React, Vite, Zustand. Nginx sert le build et proxy `/api` et `/storage`.
- `backend/` : API Express et worker BullMQ. MongoDB stocke les comptes et les tâches. MinIO stocke les images.

## Lancer

Les secrets viennent du coffre Bitwarden :

```bash
export BW_SESSION="$(bw unlock --raw)"
./scripts/bitwarden.sh compose up --build
```

- Application : http://localhost:8080
- Visualiseur Mongui : http://localhost:8081

Le compte Mongui est `MONGUI_ADMIN_USER` dans le coffre.

## BullMQ

L'API ne parle pas à MinIO. Elle dépose un job dans Redis :

- `upload` : le worker enregistre l'image, puis l'API répond avec son URL.
- `delete` : le worker supprime l'image après un remplacement ou une suppression de tâche.

## Secrets

Le coffre `mon-store-exo` contient `JWT_SECRET`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MONGUI_ADMIN_USER`, `MONGUI_ADMIN_PASSWORD` et `MONGUI_SESSION_SECRET`.

Après un changement du `.env` local :

```bash
./scripts/bitwarden.sh push
```
