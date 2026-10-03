# Supabase security notes

Frontend may only use the **anon** key via `VITE_SUPABASE_*` env vars.

## Required RLS mindset

- Enable RLS on every table that stores user data.
- Policies should scope rows by `auth.uid()`.
- Never put the service-role key in the website, Tauri app, or git.

## GitHub token proxy (optional)

Sensitive GitHub operations that should not expose a long-lived token in the browser can go through `supabase/functions/github-proxy`.

Deploy:

```bash
supabase functions deploy github-proxy
```

Set secrets in the Supabase dashboard (not in the repo).
