# Supabase for Code Master

## Contact → Admin

1. Apply `migrations/001_messages.sql`.
2. Deploy Edge Functions:

```bash
supabase functions deploy admin-messages
supabase functions deploy ai-proxy
```

3. Set secrets (dashboard / CLI), never in frontend:

- `ADMIN_GATE` — same value as local `VITE_ADMIN_GATE`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` or `AI_API_KEY`

4. Frontend `.env`:

```env
VITE_ADMIN_GATE=...
VITE_ADMIN_API_URL=https://<project>.supabase.co/functions/v1/admin-messages
VITE_AI_PROXY_URL=https://<project>.supabase.co/functions/v1/ai-proxy
```

Anon key may insert contact rows only. Reading messages goes through `admin-messages` with the admin gate header.
