# SR TAKAT — Gem & Jewellery Management System

A MERN-style inventory and business management application for gemstones,
jewellery, costing, sales, and production workflows.

## Project structure

- `client/` — React + Vite frontend
- `server/` — Express + MongoDB backend
- `docs/` — project requirements and architecture reference
- `.gitignore` — security-safe ignore rules

## Prerequisites

- Node.js 20 or later
- pnpm
- MongoDB connection URI
- Cloudinary account credentials (optional, for image upload/storage)

## Install

From the repository root:

```bash
pnpm install
```

## Configure environment variables

Copy the example env files and fill in the required values.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and set:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

If present, also update `client/.env` with frontend-specific variables.

## Run the application

Start both the frontend and backend in parallel from the repository root:

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/v1/health`

### Run individual services

```bash
pnpm run dev:client
pnpm run dev:server
```

## Build

Build only the client for production:

```bash
pnpm build
```

## Vercel deployment

This repository is configured to deploy the frontend from the `client/`
package as a static Vite app. Vercel will run the root `vercel-build`
script and serve the `client/dist` output.

1. Create a new Vercel project from this repository.
2. In Vercel project settings, select `pnpm` as the package manager.
3. Set the build command to:

```bash
pnpm vercel-build
```

4. Set the output directory to:

```bash
client/dist
```

5. Add any required environment variables for the frontend if needed.

Required environment variables (Vercel / Render):

- `VITE_API_URL` — the backend API base URL, e.g. `https://your-render-service.com/api/v1`
- `CLIENT_URL` — the frontend origin, e.g. `https://your-vercel-app.vercel.app`

Set `VITE_API_URL` in the Vercel project settings so the frontend sends API
requests to your Render-hosted backend. Set `CLIENT_URL` in the Render service
env so the backend's CORS allows the deployed frontend to send credentials.

> Note: The backend server is not deployed by this Vercel configuration.
> Use a separate Node/Mongo host for the API, then point the frontend to that API.

## Server scripts

Available server commands:

```bash
cd server
pnpm run dev
pnpm run start
pnpm run seed:roles
pnpm run seed:data
```

## Notes

- The repository uses a pnpm workspace with separate `client` and `server`
  packages.
- Documentation assets are available under `docs/`.
- Keep secrets out of Git: do not commit `.env` files or credential files.


