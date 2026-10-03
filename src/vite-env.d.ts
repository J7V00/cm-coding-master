/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_GITHUB_LIBRARY_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  CMDesktop?: import("./shared/desktop").DesktopAPI;
  CMGitHub?: import("./shared/github").GitHubAPI;
  __TAURI__?: Record<string, any>;
}
