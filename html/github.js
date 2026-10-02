/* Coding Master — shared GitHub integration */
(function(){
  "use strict";

  const SUPABASE_URL = "https://wkoyeiydytlgtoknypkd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_r3BxLBSCV85_7qR6WvYBdw_Bf9qCZe0";
  const PROFILE_KEY = "cm-github-profile";
  const LIBRARY_URL = "https://github.com/J7V00/cm-coding-master";
  const GITHUB_REPO_KEY = "cm-github-repository";

  let client = null;
  let session = null;
  let profile = null;

  function safeRead(){
    try{
      const value = localStorage.getItem(PROFILE_KEY);
      return value ? JSON.parse(value) : null;
    }catch{
      return null;
    }
  }

  function safeWrite(value){
    try{
      if(value) localStorage.setItem(PROFILE_KEY,JSON.stringify(value));
      else localStorage.removeItem(PROFILE_KEY);
    }catch{}
  }

  function readRepository(){
    try{
      const value=localStorage.getItem(GITHUB_REPO_KEY);
      return value ? JSON.parse(value) : null;
    }catch{
      return null;
    }
  }

  function writeRepository(value){
    try{
      if(value) localStorage.setItem(GITHUB_REPO_KEY,JSON.stringify(value));
      else localStorage.removeItem(GITHUB_REPO_KEY);
    }catch{}
  }

  function isTauriDesktop(){
    return Boolean(window.__TAURI__?.deepLink);
  }

  function currentRedirect(){
    if(isTauriDesktop()){
      return "codingmaster://auth/callback";
    }

    if(location.protocol === "http:" || location.protocol === "https:"){
      return "https://j7v00.github.io/cm-coding-master/welcome.html";
    }

    return null;
  }

  async function handleTauriAuthUrl(rawUrl){
    try{
      const url=new URL(rawUrl);

      if(url.protocol !== "codingmaster:") return;
      if(url.hostname !== "auth" && url.pathname !== "/auth/callback") return;

      const code=url.searchParams.get("code");
      const error=url.searchParams.get("error");
      const errorDescription=url.searchParams.get("error_description");

      if(error){
        console.error("GitHub OAuth error:",errorDescription||error);
        return;
      }

      if(code){
        const sb=ensureClient();
        if(!sb) return;

        const result=await sb.auth.exchangeCodeForSession(code);

        if(result.error){
          console.error("GitHub OAuth exchange failed:",result.error.message);
          return;
        }

        await refresh();
      }
    }catch(error){
      console.error("Invalid Coding Master deep link:",error);
    }
  }

  async function setupTauriDeepLink(){
    const deepLink=window.__TAURI__?.deepLink;
    if(!deepLink) return;

    try{
      const startUrls=await deepLink.getCurrent();

      if(Array.isArray(startUrls)){
        for(const url of startUrls){
          await handleTauriAuthUrl(url);
        }
      }

      await deepLink.onOpenUrl(async urls=>{
        if(Array.isArray(urls)){
          for(const url of urls){
            await handleTauriAuthUrl(url);
          }
        }
      });
    }catch(error){
      console.error("Coding Master deep-link setup failed:",error);
    }
  }

  function getMetadata(user){
    const m = user?.user_metadata || {};
    return {
      id: user?.id || "",
      login: m.user_name || m.preferred_username || m.login || m.nickname || "",
      name: m.full_name || m.name || m.user_name || m.preferred_username || "GitHub User",
      avatar_url: m.avatar_url || m.picture || "",
      html_url: m.html_url || ""
    };
  }

  async function verifyWithGitHubProvider(user, providerToken){
    const metadata = getMetadata(user);

    if(!providerToken) return metadata;

    try{
      const response = await fetch("https://api.github.com/user",{
        headers:{
          "Accept":"application/vnd.github+json",
          "Authorization":"Bearer "+providerToken,
          "X-GitHub-Api-Version":"2026-03-10"
        }
      });

      if(!response.ok) return metadata;

      const githubUser = await response.json();

      return {
        id:user?.id || "",
        login:githubUser.login || metadata.login,
        name:githubUser.name || githubUser.login || metadata.name,
        avatar_url:githubUser.avatar_url || metadata.avatar_url,
        html_url:githubUser.html_url || metadata.html_url,
        verified:true
      };
    }catch{
      return metadata;
    }
  }

  function ensureClient(){
    if(client) return client;

    if(!window.supabase?.createClient){
      console.error("Supabase JS was not loaded.");
      return null;
    }

    client = window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    return client;
  }

  function render(){
    let card=document.getElementById("cmGithubCard");

    if(!card){
      card=document.createElement("aside");
      card.id="cmGithubCard";
      card.className="cm-github-card";
      document.body.appendChild(card);
    }

    if(profile?.login){
      const avatar=profile.avatar_url || "assets/logo.png";
      const displayName=profile.name || profile.login;

      card.innerHTML=
        '<button class="cm-github-circle" id="cmGithubMenuBtn" type="button" aria-label="Open GitHub menu" title="'+escapeAttr(displayName)+'">'+
          '<img class="cm-github-avatar" src="'+escapeAttr(avatar)+'" alt="GitHub avatar">'+
        '</button>'+
        '<div class="cm-github-menu" id="cmGithubMenu">'+
          '<div class="cm-github-powered">Powered by GitHub Integration</div>'+
          '<a href="'+escapeAttr(profile.html_url || ("https://github.com/"+profile.login))+'" target="_blank" rel="noopener">Open GitHub Profile</a>'+
          '<button type="button" id="cmGithubReposBtn">Repositories</button>'+
          '<button type="button" id="cmGithubSyncBtn">Enable Project Sync</button>'+
          '<div class="cm-github-divider"></div>'+
          '<button type="button" id="cmGithubDisconnectBtn">Sign out of GitHub</button>'+
        '</div>';

      document.getElementById("cmGithubMenuBtn").addEventListener("click",()=>{
        document.getElementById("cmGithubMenu").classList.toggle("open");
      });

      document.getElementById("cmGithubDisconnectBtn").addEventListener("click",disconnect);

      document.getElementById("cmGithubReposBtn").addEventListener("click",()=>{
        window.dispatchEvent(new CustomEvent("cm:github:repositories"));
        document.getElementById("cmGithubMenu").classList.remove("open");
      });

      document.getElementById("cmGithubSyncBtn").addEventListener("click",connectWithRepoAccess);
    }else{
      card.innerHTML=
        '<button class="cm-github-circle cm-github-disconnected" id="cmGithubConnectBtn" type="button" aria-label="Connect GitHub" title="Connect GitHub">'+
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 8.364 22.91c.575.106.786-.25.786-.555 0-.273-.01-1.001-.015-1.965-3.197.695-3.872-1.541-3.872-1.541-.523-1.327-1.277-1.68-1.277-1.68-1.044-.713.079-.699.079-.699 1.154.081 1.761 1.185 1.761 1.185 1.026 1.759 2.692 1.252 3.349.958.104-.744.402-1.252.731-1.54-2.553-.29-5.237-1.277-5.237-5.683 0-1.256.449-2.282 1.184-3.087-.119-.29-.513-1.458.112-3.04 0 0 .966-.309 3.166 1.179A10.99 10.99 0 0 1 12 6.067a10.99 10.99 0 0 1 2.884.389c2.2-1.488 3.165-1.179 3.165-1.179.626 1.582.232 2.75.113 3.04.735.805 1.183 1.831 1.183 3.087 0 4.418-2.689 5.389-5.251 5.674.413.356.781 1.063.781 2.144 0 1.547-.014 2.794-.014 3.176 0 .308.208.667.792.554A11.503 11.503 0 0 0 12 .5Z"/></svg>'+
        '</button>';

      document.getElementById("cmGithubConnectBtn").addEventListener("click",connect);
    }
  }

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"]/g,ch=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
    }[ch]));
  }

  function escapeAttr(value){
    return escapeHtml(value).replace(/'/g,"&#039;");
  }

  async function refresh(){
    const sb=ensureClient();
    profile=safeRead();

    if(!sb){
      render();
      return;
    }

    const result=await sb.auth.getSession();
    session=result?.data?.session || null;

    if(session?.user){
      profile=await verifyWithGitHubProvider(session.user,session.provider_token);
      profile.provider="github";
      safeWrite(profile);
    }else{
      profile=null;
      safeWrite(null);
    }

    render();

    window.dispatchEvent(new CustomEvent("cm:github:state",{
      detail:{connected:Boolean(profile?.login),profile,session}
    }));
  }

  const WEB_APP_URL="https://j7v00.github.io/cm-coding-master/welcome.html";

  async function connect(){
    const sb=ensureClient();

    if(!sb){
      alert("Supabase is not available.");
      return;
    }

    if(!isTauriDesktop()){
      const onHostedSite =
        location.protocol==="https:" &&
        location.hostname==="j7v00.github.io" &&
        location.pathname.endsWith("/cm-coding-master/welcome.html");

      if(!onHostedSite){
        window.location.assign(WEB_APP_URL+"?cmgithub=connect");
        return;
      }
    }

    const redirectTo=currentRedirect();

    if(!redirectTo){
      alert("GitHub login could not determine a redirect URL.");
      return;
    }

    const {error}=await sb.auth.signInWithOAuth({
      provider:"github",
      options:{
        redirectTo
      }
    });

    if(error) alert(error.message);
  }

  async function autoStartHostedLogin(){
    if(isTauriDesktop()) return;

    const params=new URLSearchParams(location.search);
    if(params.get("cmgithub")!=="connect") return;

    params.delete("cmgithub");
    const clean=location.pathname+(params.toString()?"?"+params.toString():"");
    window.history.replaceState({},document.title,clean);

    await connect();
  }

  async function connectWithRepoAccess(){
    const sb=ensureClient();
    if(!sb) return;

    const redirectTo=currentRedirect();

    if(!redirectTo){
      alert("GitHub project sync needs the hosted Coding Master website.");
      return;
    }

    const {error}=await sb.auth.signInWithOAuth({
      provider:"github",
      options:{
        redirectTo,
        scopes:"repo"
      }
    });

    if(error) alert(error.message);
  }

  async function disconnect(){
    const sb=ensureClient();

    if(sb) await sb.auth.signOut();

    profile=null;
    session=null;
    safeWrite(null);
    render();

    window.dispatchEvent(new CustomEvent("cm:github:state",{
      detail:{connected:false,profile:null,session:null}
    }));
  }

  async function githubApi(path,options={}){
    const sb=ensureClient();
    if(!sb) throw new Error("Supabase is not available.");

    const result=await sb.auth.getSession();
    const active=result?.data?.session;

    if(!active?.provider_token){
      throw new Error("GitHub authorization is not available. Connect GitHub again.");
    }

    const response=await fetch("https://api.github.com"+path,{
      ...options,
      headers:{
        "Accept":"application/vnd.github+json",
        "Authorization":"Bearer "+active.provider_token,
        "X-GitHub-Api-Version":"2026-03-10",
        ...(options.headers||{})
      }
    });

    if(!response.ok){
      let message="GitHub request failed.";
      try{
        const data=await response.json();
        if(data?.message) message=data.message;
      }catch{}
      throw new Error(message);
    }

    return response.json();
  }

  async function listRepositories(){
    const repositories=await githubApi("/user/repos?sort=updated&per_page=50&type=all");
    return Array.isArray(repositories)?repositories:[];
  }

  async function getRepository(owner,name){
    return githubApi("/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(name));
  }

  async function getRepositoryTree(owner,name,branch){
    const repository=await getRepository(owner,name);
    const ref=branch||repository.default_branch;
    const data=await githubApi("/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(name)+"/git/trees/"+encodeURIComponent(ref)+"?recursive=1");
    return {repository,branch:ref,tree:Array.isArray(data.tree)?data.tree:[]};
  }

  async function getRepositoryFile(owner,name,path,branch){
    const ref=branch||readRepository()?.branch||null;
    return githubApi("/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(name)+"/contents/"+path.split("/").map(encodeURIComponent).join("/")+ (ref?"?ref="+encodeURIComponent(ref):""));
  }

  async function saveRepositoryFile(owner,name,path,content,message,branch,sha){
    const active=await (async()=>{
      const saved=readRepository();
      const repository=await getRepository(owner,name);
      return {repository,branch:branch||saved?.branch||repository.default_branch};
    })();

    const result=await githubApi("/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(name)+"/contents/"+path.split("/").map(encodeURIComponent).join("/"),{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        message:message||("Update "+path+" from Coding Master"),
        content:btoa(unescape(encodeURIComponent(content))),
        sha:sha||undefined,
        branch:active.branch
      })
    });

    writeRepository({
      owner,
      name,
      branch:active.branch,
      full_name:owner+"/"+name,
      html_url:active.repository.html_url||("https://github.com/"+owner+"/"+name)
    });

    return result;
  }

  function selectRepository(repository){
    if(!repository?.full_name)return null;
    const parts=repository.full_name.split("/");
    const selected={
      owner:parts[0],
      name:parts[1],
      branch:repository.default_branch||"main",
      full_name:repository.full_name,
      html_url:repository.html_url||("https://github.com/"+repository.full_name)
    };
    writeRepository(selected);
    window.dispatchEvent(new CustomEvent("cm:github:repository-selected",{detail:selected}));
    return selected;
  }

  window.CMGitHub={
    refresh,
    connect,
    connectWithRepoAccess,
    disconnect,
    getProfile:()=>profile,
    getSession:()=>session,
    getSelectedRepository:()=>readRepository(),
    listRepositories,
    getRepositoryTree,
    getRepositoryFile,
    saveRepositoryFile,
    selectRepository,
    api:githubApi,
    isConnected:()=>Boolean(profile?.login),
    repositoryUrl:LIBRARY_URL
  };

  document.addEventListener("DOMContentLoaded",async()=>{
    const sb=ensureClient();

    if(sb){
      sb.auth.onAuthStateChange(async()=>{
        await refresh();
      });
    }

    await setupTauriDeepLink();
    await refresh();
    await autoStartHostedLogin();
  });
})();
