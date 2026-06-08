# Anos 2000

Portfolio interativo inspirado no Windows XP e na internet dos anos 2000.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase: Postgres, Auth, Storage and Realtime
- Vercel deploy

## Local development

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and fill the values locally or in Vercel.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit `.env.local` or any real secret.

## Architecture

See `docs/ARCHITECTURE.md` and `docs/SECURITY.md`.

## Deploy

Connect this GitHub repository in Vercel and add the environment variables in Project Settings.
