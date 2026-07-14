# SR TAKAT — Gem & Jewellery Management System

Folder structure scaffolded per `docs/SR_TAKAT_Antigravity_Prompt.md`.
Full requirements: `docs/SR_TAKAT_PRD.docx`. Data model diagram: `docs/SR_TAKAT_ERD.png`.

## Setup

```bash
pnpm install

# server
cp server/.env.example server/.env
# fill in MONGO_URI, JWT secrets, Cloudinary keys

# run both client + server
pnpm dev
```

Client: http://localhost:5173
Server: http://localhost:5000/api/v1/health

## What's here vs. what's next

This scaffold creates the full folder structure (client modules, shared
components, server models/controllers/routes/services) as empty files with
correct naming — matching `docs/SR_TAKAT_Antigravity_Prompt.md` exactly.

Nothing is implemented yet. Next step: open this folder in Claude Code and
build module by module, e.g.:

> "Read docs/SR_TAKAT_Antigravity_Prompt.md, then implement the auth module
> end-to-end: User + Role models, authController, authService, authRoutes,
> JWT + refresh token flow, and the client auth module (login page, AuthLayout,
> authApi, useAuth hook)."

Then repeat for inventory, products, production, costing, memo, sales, reports.
