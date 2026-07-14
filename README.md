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

## Additional resources

- `docs/SR_TAKAT_Antigravity_Prompt.md`
- `docs/SR_TAKAT_PRD.docx`
- `docs/SR_TAKAT_ERD.png`
