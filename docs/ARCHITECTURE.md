# Architecture

## Stack

- Next.js App Router for the Vercel app.
- TypeScript for contracts between features.
- Supabase for Postgres, Auth, Storage and Realtime.
- Vercel Serverless/Route Handlers for admin-only operations.

## Feature boundaries

- `src/app`: routes, layouts and composition.
- `src/config`: static product configuration.
- `src/features/desktop`: Windows XP shell, apps registry, boot and login.
- `src/features/messenger`: MSN contacts, presence, private chat and status.
- `src/features/uol-chat`: public rooms and room messages.
- `src/features/media`: Winamp playlist, photos, videos and documents.
- `src/features/admin`: protected dashboard and moderation tools.
- `src/lib`: framework and provider clients.
- `src/types`: shared TypeScript contracts.

## Rules

- UI components do not call Supabase directly when business rules are involved.
- Server-only code stays behind `server-only` imports or route handlers.
- Public env vars use `NEXT_PUBLIC_`; private keys never do.
- Supabase RLS is mandatory before production data is stored.
- Imported open-source repos should be adapted into feature folders instead of copied as one large blob.
