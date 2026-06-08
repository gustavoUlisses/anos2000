# Security

## Secrets

- `.env*` files are ignored by Git.
- Commit only `.env.example`.
- Never place `SUPABASE_SERVICE_ROLE_KEY` in client components.
- Review `git diff --cached` before every commit that touches config or env files.

## Supabase

- Enable RLS on all public tables.
- Use the anon key only for operations explicitly allowed by policies.
- Use service role only in server-only code.
- Reserve the `GusDev` nick for the site owner.

## Chat safety

- Treat all nicknames and messages as untrusted input.
- Validate message length on client and server.
- Store moderation/audit data separately from public UI queries.
- Add rate limits before opening the project to broader traffic.
