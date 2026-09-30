/* Coding Master — shared GitHub integration */
(function(){
  "use strict";

  const SUPABASE_URL = "https://wkoyeiydytlgtoknypkd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_r3BxLBSCV85_7qR6WvYBdw_Bf9qCZe0";
  const PROFILE_KEY = "cm-github-profile";
  const LIBRARY_URL = "https://github.com/J7V00/cm-coding-master";

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

  function currentRedirect(){
    if(location.protocol === "http:" || location.protocol === "https:"){
      return location.href;
    }
    return null;
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
        '<img class="cm-github-avatar" src="'+escapeAttr(avatar)+'" alt="GitHub avatar">'+
        '<div class="cm-github-copy">'+
          '<strong class="cm-github-name">'+escapeHtml(displayName)+'</strong>'+
          '<span class="cm-github-status connected">● GitHub Connected</span>'+
        '</div>'+
        '<button class="cm-github-btn" id="cmGithubMenuBtn" type="button" aria-label="GitHub menu">•••</button>'+
        '<div class="cm-github-menu" id="cmGithubMenu">'+
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
        '<div class="cm-github-connect-icon">GH</div>'+
        '<div class="cm-github-copy">'+
          '<strong class="cm-github-name">Connect GitHub</strong>'+
          '<span class="cm-github-status">Verify your GitHub account</span>'+
        '</div>'+
        '<button class="cm-github-btn" id="cmGithubConnectBtn" type="button">Connect</button>';

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

  async function connect(){
    const sb=ensureClient();

    if(!sb){
      alert("Supabase is not available.");
      return;
    }

    const redirectTo=currentRedirect();

    if(!redirectTo){
      alert("GitHub login needs the hosted Coding Master website. Open Coding Master from its website first.");
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

  window.CMGitHub={
    refresh,
    connect,
    connectWithRepoAccess,
    disconnect,
    getProfile:()=>profile,
    getSession:()=>session,
    api:githubApi,
    isConnected:()=>Boolean(profile?.login),
    repositoryUrl:LIBRARY_URL
  };

  document.addEventListener("DOMContentLoaded",()=>{
    const sb=ensureClient();

    if(sb){
      sb.auth.onAuthStateChange(async()=>{
        await refresh();
      });
    }

    refresh();
  });
})();
