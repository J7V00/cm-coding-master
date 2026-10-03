import { getSupabase } from "./supabase";
import { escapeAttr, escapeHtml } from "./paths";

const PROFILE_KEY = "cm-github-profile";
const GITHUB_REPO_KEY = "cm-github-repository";
const LIBRARY_URL =
  import.meta.env.VITE_GITHUB_LIBRARY_URL ||
  "https://github.com/J7V00/cm-coding-master";
const SITE_URL =
  import.meta.env.VITE_SITE_URL ||
  "https://j7v00.github.io/cm-coding-master";

export type GitHubProfile = {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  provider?: string;
  verified?: boolean;
};

export type GitHubRepo = {
  owner: string;
  name: string;
  branch: string;
  full_name: string;
  html_url: string;
};

export type GitHubAPI = {
  refresh: () => Promise<void>;
  connect: () => Promise<void>;
  connectWithRepoAccess: () => Promise<void>;
  disconnect: () => Promise<void>;
  getProfile: () => GitHubProfile | null;
  getSession: () => any;
  getSelectedRepository: () => GitHubRepo | null;
  listRepositories: () => Promise<any[]>;
  getRepositoryTree: (owner: string, name: string, branch?: string) => Promise<any>;
  getRepositoryFile: (owner: string, name: string, path: string, branch?: string) => Promise<any>;
  saveRepositoryFile: (
    owner: string,
    name: string,
    path: string,
    content: string,
    message: string,
    branch?: string,
    sha?: string | null,
  ) => Promise<any>;
  selectRepository: (repository: any) => GitHubRepo | null;
  api: (path: string, options?: RequestInit) => Promise<any>;
  isConnected: () => boolean;
  repositoryUrl: string;
};

function safeRead(): GitHubProfile | null {
  try {
    const value = localStorage.getItem(PROFILE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function safeWrite(value: GitHubProfile | null): void {
  try {
    if (value) localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

function readRepository(): GitHubRepo | null {
  try {
    const value = localStorage.getItem(GITHUB_REPO_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeRepository(value: GitHubRepo | null): void {
  try {
    if (value) localStorage.setItem(GITHUB_REPO_KEY, JSON.stringify(value));
    else localStorage.removeItem(GITHUB_REPO_KEY);
  } catch {
    /* ignore */
  }
}

function isTauriDesktop(): boolean {
  return Boolean(window.__TAURI__?.deepLink);
}

function currentRedirect(): string | null {
  if (isTauriDesktop()) return "codingmaster://auth/callback";
  if (location.protocol === "http:" || location.protocol === "https:") {
    return `${SITE_URL.replace(/\/$/, "")}/welcome.html`;
  }
  return null;
}

export function installGitHub(): GitHubAPI {
  let session: any = null;
  let profile: GitHubProfile | null = null;

  function getMetadata(user: any): GitHubProfile {
    const m = user?.user_metadata || {};
    return {
      id: user?.id || "",
      login: m.user_name || m.preferred_username || m.login || m.nickname || "",
      name: m.full_name || m.name || m.user_name || m.preferred_username || "GitHub User",
      avatar_url: m.avatar_url || m.picture || "",
      html_url: m.html_url || "",
    };
  }

  async function verifyWithGitHubProvider(user: any, providerToken?: string | null) {
    const metadata = getMetadata(user);
    if (!providerToken) return metadata;

    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "Bearer " + providerToken,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (!response.ok) return metadata;
      const githubUser = await response.json();
      return {
        id: user?.id || "",
        login: githubUser.login || metadata.login,
        name: githubUser.name || githubUser.login || metadata.name,
        avatar_url: githubUser.avatar_url || metadata.avatar_url,
        html_url: githubUser.html_url || metadata.html_url,
        verified: true,
      };
    } catch {
      return metadata;
    }
  }

  function render() {
    let card = document.getElementById("cmGithubCard");
    if (!card) {
      card = document.createElement("aside");
      card.id = "cmGithubCard";
      card.className = "cm-github-card";
      document.body.appendChild(card);
    }

    if (profile?.login) {
      const avatar = profile.avatar_url || "/assets/logo.png";
      const displayName = profile.name || profile.login;
      card.innerHTML =
        `<button class="cm-github-circle" id="cmGithubMenuBtn" type="button" aria-label="Open GitHub menu" title="${escapeAttr(displayName)}">` +
        `<img class="cm-github-avatar" src="${escapeAttr(avatar)}" alt="GitHub avatar">` +
        `</button>` +
        `<div class="cm-github-menu" id="cmGithubMenu">` +
        `<div class="cm-github-powered">Powered by GitHub Integration</div>` +
        `<a href="${escapeAttr(profile.html_url || "https://github.com/" + profile.login)}" target="_blank" rel="noopener">Open GitHub Profile</a>` +
        `<button type="button" id="cmGithubReposBtn">Repositories</button>` +
        `<button type="button" id="cmGithubSyncBtn">Enable Project Sync</button>` +
        `<div class="cm-github-divider"></div>` +
        `<button type="button" id="cmGithubDisconnectBtn">Sign out of GitHub</button>` +
        `</div>`;

      document.getElementById("cmGithubMenuBtn")?.addEventListener("click", () => {
        document.getElementById("cmGithubMenu")?.classList.toggle("open");
      });
      document.getElementById("cmGithubDisconnectBtn")?.addEventListener("click", () => void disconnect());
      document.getElementById("cmGithubReposBtn")?.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("cm:github:repositories"));
        document.getElementById("cmGithubMenu")?.classList.remove("open");
      });
      document.getElementById("cmGithubSyncBtn")?.addEventListener("click", () => void connectWithRepoAccess());
    } else {
      card.innerHTML =
        `<button class="cm-github-circle cm-github-disconnected" id="cmGithubLoginCircle" type="button" aria-label="GitHub" title="GitHub">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 8.364 22.91c.575.106.786-.25.786-.555 0-.273-.01-1.001-.015-1.965-3.197.695-3.872-1.541-3.872-1.541-.523-1.327-1.277-1.68-1.277-1.68-1.044-.713.079-.699.079-.699 1.154.081 1.761 1.185 1.761 1.185 1.026 1.759 2.692 1.252 3.349.958.104-.744.402-1.252.731-1.54-.119-.29-.513-1.458.112-3.04 0 0 .966-.309 3.166 1.179A10.99 10.99 0 0 1 12 6.067a10.99 10.99 0 0 1 2.884.389c2.2-1.488 3.165-1.179 3.165-1.179.626 1.582.232 2.75.113 3.04.735.805 1.183 1.831 1.183 3.087 0 4.418-2.689 5.389-5.251 5.674.413.356.781 1.063.781 2.144 0 1.547-.014 2.794-.014 3.176 0 .308.208.667.792.554A11.503 11.503 0 0 0 12 .5Z"/></svg>` +
        `</button>` +
        `<div class="cm-github-menu cm-github-login-menu" id="cmGithubLoginMenu">` +
        `<button type="button" id="cmGithubConnectBtn">Sign in with GitHub</button>` +
        `</div>`;

      document.getElementById("cmGithubConnectBtn")?.addEventListener("click", () => {
        document.getElementById("cmGithubLoginMenu")?.classList.remove("open");
        void connect();
      });
      document.getElementById("cmGithubLoginCircle")?.addEventListener("click", (event) => {
        event.stopPropagation();
        document.getElementById("cmGithubLoginMenu")?.classList.toggle("open");
      });
    }
  }

  async function refresh() {
    const sb = getSupabase();
    profile = safeRead();
    if (!sb) {
      render();
      return;
    }

    const result = await sb.auth.getSession();
    session = result?.data?.session || null;

    if (session?.user) {
      profile = await verifyWithGitHubProvider(session.user, session.provider_token);
      profile.provider = "github";
      safeWrite(profile);
    } else {
      profile = null;
      safeWrite(null);
    }

    render();
    window.dispatchEvent(
      new CustomEvent("cm:github:state", {
        detail: { connected: Boolean(profile?.login), profile, session },
      }),
    );
  }

  async function handleTauriAuthUrl(rawUrl: string) {
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "codingmaster:") return;
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      if (error) return;
      if (!code) return;
      const sb = getSupabase();
      if (!sb) return;
      const result = await sb.auth.exchangeCodeForSession(code);
      if (!result.error) await refresh();
    } catch {
      /* ignore */
    }
  }

  async function setupTauriDeepLink() {
    const deepLink = window.__TAURI__?.deepLink;
    if (!deepLink) return;
    try {
      const startUrls = await deepLink.getCurrent();
      if (Array.isArray(startUrls)) {
        for (const url of startUrls) await handleTauriAuthUrl(url);
      }
      await deepLink.onOpenUrl(async (urls: string[]) => {
        if (Array.isArray(urls)) {
          for (const url of urls) await handleTauriAuthUrl(url);
        }
      });
    } catch {
      /* ignore */
    }
  }

  async function connect() {
    const sb = getSupabase();
    if (!sb) {
      alert("Supabase is not available.");
      return;
    }

    if (!isTauriDesktop()) {
      const onHosted =
        location.protocol === "https:" &&
        (location.hostname.includes("github.io") || location.hostname.includes("netlify"));
      if (!onHosted && !import.meta.env.DEV) {
        window.location.assign(`${SITE_URL.replace(/\/$/, "")}/welcome.html?cmgithub=connect`);
        return;
      }
    }

    const redirectTo = currentRedirect();
    if (!redirectTo) {
      alert("GitHub login could not determine a redirect URL.");
      return;
    }

    const { error } = await sb.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    });
    if (error) alert(error.message);
  }

  async function connectWithRepoAccess() {
    const sb = getSupabase();
    if (!sb) return;
    const redirectTo = currentRedirect();
    if (!redirectTo) {
      alert("GitHub project sync needs the hosted Coding Master website.");
      return;
    }
    const { error } = await sb.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo, scopes: "repo" },
    });
    if (error) alert(error.message);
  }

  async function disconnect() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    profile = null;
    session = null;
    safeWrite(null);
    render();
    window.dispatchEvent(
      new CustomEvent("cm:github:state", {
        detail: { connected: false, profile: null, session: null },
      }),
    );
  }

  async function githubApi(path: string, options: RequestInit = {}) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase is not available.");
    const result = await sb.auth.getSession();
    const active = result?.data?.session;
    if (!active?.provider_token) {
      throw new Error("GitHub authorization is not available. Connect GitHub again.");
    }

    const response = await fetch("https://api.github.com" + path, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + active.provider_token,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let message = "GitHub request failed.";
      try {
        const data = await response.json();
        if (data?.message) message = data.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }

    return response.json();
  }

  const api: GitHubAPI = {
    refresh,
    connect,
    connectWithRepoAccess,
    disconnect,
    getProfile: () => profile,
    getSession: () => session,
    getSelectedRepository: () => readRepository(),
    async listRepositories() {
      const repositories = await githubApi("/user/repos?sort=updated&per_page=50&type=all");
      return Array.isArray(repositories) ? repositories : [];
    },
    async getRepositoryTree(owner, name, branch) {
      const repository = await githubApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
      const ref = branch || repository.default_branch;
      const data = await githubApi(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      );
      return { repository, branch: ref, tree: Array.isArray(data.tree) ? data.tree : [] };
    },
    async getRepositoryFile(owner, name, path, branch) {
      const ref = branch || readRepository()?.branch || null;
      return githubApi(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/${path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}${ref ? "?ref=" + encodeURIComponent(ref) : ""}`,
      );
    },
    async saveRepositoryFile(owner, name, path, content, message, branch, sha) {
      const saved = readRepository();
      const repository = await githubApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
      const activeBranch = branch || saved?.branch || repository.default_branch;
      const result = await githubApi(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/${path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message || `Update ${path} from Coding Master`,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha || undefined,
            branch: activeBranch,
          }),
        },
      );
      writeRepository({
        owner,
        name,
        branch: activeBranch,
        full_name: `${owner}/${name}`,
        html_url: repository.html_url || `https://github.com/${owner}/${name}`,
      });
      return result;
    },
    selectRepository(repository) {
      if (!repository?.full_name) return null;
      const parts = String(repository.full_name).split("/");
      const selected: GitHubRepo = {
        owner: parts[0],
        name: parts[1],
        branch: repository.default_branch || "main",
        full_name: repository.full_name,
        html_url: repository.html_url || `https://github.com/${repository.full_name}`,
      };
      writeRepository(selected);
      window.dispatchEvent(new CustomEvent("cm:github:repository-selected", { detail: selected }));
      return selected;
    },
    api: githubApi,
    isConnected: () => Boolean(profile?.login),
    repositoryUrl: LIBRARY_URL,
  };

  window.CMGitHub = api;

  const sb = getSupabase();
  if (sb) {
    sb.auth.onAuthStateChange(async () => {
      await refresh();
    });
  }

  void (async () => {
    await setupTauriDeepLink();
    await refresh();
    const params = new URLSearchParams(location.search);
    if (!isTauriDesktop() && params.get("cmgithub") === "connect") {
      params.delete("cmgithub");
      const clean = location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, document.title, clean);
      await connect();
    }
  })();

  return api;
}

// silence unused in strict builds when menu HTML uses escapeHtml
void escapeHtml;
