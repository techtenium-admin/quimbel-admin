# Quimbel Admin

Standalone internal console: **Prisma → same Postgres as Quimbel**, staff login, overview metrics, user directory, support replies (**Resend** + local email template).

There is **no** dependency on `quimbel-nextjs` at runtime — only the **Prisma schema** should stay in sync when the main app migrates.

## Environment

Use the **same** database and Resend settings as production Quimbel. Copy from `quimbel-nextjs` `.env` / `.env.local` and ensure:

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres (e.g. Supabase `:6543`) — same as main app |
| `DIRECT_DATABASE_URL` | Direct connection for `prisma migrate` if you run migrations here (usually you migrate from `quimbel-nextjs` only) |
| `RESEND_API_KEY`, `EMAIL_CONTACT` / `CONTACT_EMAIL` | Ticket reply emails |
| `NEXT_PUBLIC_APP_URL` | Main app URL for “View conversation” links |
| `JWT_SECRET` or `ADMIN_JWT_SECRET` | Signs admin session cookies (≥32 chars) |
| `ADMIN_PASSWORD_HASH` | bcrypt hash for the admin login password |

Optional symlink (monorepo): `ln -sf ../quimbel-nextjs/.env.local .env.local` then add `ADMIN_PASSWORD_HASH` if missing.

## Prisma schema

`prisma/schema.prisma` is a **copy** of the main app’s schema. When `quimbel-nextjs` migrations change the database, **copy the schema file again** and run `yarn prisma generate` (or `yarn install` / `yarn build`, which runs `prisma generate`).

Do **not** run conflicting migrations from two repos against the same DB; treat **`quimbel-nextjs` as the source of migrations**.

## Run

```bash
yarn install
yarn dev
```

Port **3001**. Ensure `quimbel-nextjs` is not required for admin to function (only the shared database and Resend).

## Testing

```bash
yarn test          # Vitest (dashboard stats mapping)
yarn lint
yarn type-check
yarn build
```

Smoke checks (dev server on `:3001`): `GET /api/stats` without cookie → **401**; `GET /login` → **200**; wrong password `POST /api/auth/login` → **401**.

## Performance

- **Dashboard `/api/stats`** uses **two SQL round-trips** (scalar aggregates + invoice status breakdown), not one query per metric — important when the database is remote (e.g. Supabase).
- **Auth:** JWT is verified **once** in `middleware.ts`. API routes no longer repeat verification.
- **`ensureConnected()`** warms the Prisma pool before queries to reduce cold-start latency.
- **Tickets list** uses `select` (not full `include`) and caps at **150** rows.

In development, React Strict Mode can **run effects twice**, so you may see duplicate `fetch` calls in the Network tab — production does not do that.

## Security notes

- Restrict deployment (VPN, IP allowlist, private network).
- This service holds **`DATABASE_URL`** — protect like production credentials.
- Rotate staff password hash and session secrets on the same schedule as other secrets.
