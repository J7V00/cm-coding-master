# Coding Master

Arabic-first coding workspace: marketing site + browser/desktop editor (Tauri 2).

## Stack

- **Vite + TypeScript** frontend
- **CodeMirror 6** editor
- **IndexedDB** project storage (`idb-keyval`)
- **Supabase** auth (GitHub OAuth) + Contact messages
- **Tauri 2 / Rust** desktop shell (starts on `welcome.html`)
- **AI assistant** via secure proxy (`VITE_AI_PROXY_URL`) — shortcut `⌥⇧A`
- **Vitest** unit tests

## Brand

Dark professional palette: `#05070D`, cards `#0F1A33`, buttons `#34558A`. Avoid CSS transparency (`rgba`, `opacity`, `backdrop-filter`).

## Quick start

```bash
npm install
npm run dev
```

App URLs:

- Site: `http://localhost:5173/`
- Welcome: `/welcome.html`
- Editor: `/editor.html`

```bash
npm test
npm run build
```

Desktop:

```bash
npm run tauri:dev
npm run tauri:build
```

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`

## Project layout

- `src/app` — editor / welcome app
- `src/web` — marketing site bootstrap
- `src/shared` — paths, storage, i18n, supabase, github, desktop
- `src/styles` — CSS
- `public` — assets, PWA, downloads readme
- `src-tauri` — desktop shell
- `supabase` — RLS notes + edge function stub
- `html/` — legacy sources (kept for reference; Vite entries are root `*.html`)

## Downloads

Installers are published on [GitHub Releases](https://github.com/J7V00/cm-coding-master/releases/latest), not committed into git.
