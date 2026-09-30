(function(){
  "use strict";

  const SHA_KEY="cm-github-file-shas";

  function readShas(){
    try{
      return JSON.parse(localStorage.getItem(SHA_KEY)||"{}")||{};
    }catch{
      return {};
    }
  }

  function writeShas(value){
    try{localStorage.setItem(SHA_KEY,JSON.stringify(value));}catch{}
  }

  function decodeBase64(value){
    const binary=atob(String(value||"").replace(/\n/g,""));
    const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }

  function supported(path){
    return ["html","htm","css","js","jsx","ts","tsx","json","md","txt","xml","svg"].includes(extension(path));
  }

  async function repositoriesView(){
    if(!window.CMGitHub?.isConnected()){
      panelBody.innerHTML="<p class=\"problem-row\">Connect your GitHub account first.</p>";
      return;
    }

    try{
      const list=await CMGitHub.listRepositories();
      document.getElementById("sideTitle").textContent="GITHUB";
      sideContent.innerHTML=
        '<div class="github-panel-title">YOUR REPOSITORIES</div>'+
        (list.length?list.map(repository=>
          '<button class="tree-file github-repo" type="button" data-repo="'+escapeAttr(repository.full_name||"")+'">'+
          '<span class="file-icon text">'+(repository.private?"◆":"◇")+'</span>'+
          '<span>'+escapeHtml(repository.name||"Repository")+'</span></button>'
        ).join(""):'<div class="sidebar-note"><b>No repositories</b><span>No repositories were returned by GitHub.</span></div>');

      sideContent.querySelectorAll(".github-repo").forEach(button=>{
        button.addEventListener("click",()=>{
          const item=list.find(repo=>repo.full_name===button.dataset.repo);
          if(item)openRepository(item);
        });
      });

      panelBody.innerHTML='<div>$ github repositories</div><p class="success-row">Loaded '+list.length+" repository(s).</p>";
    }catch(error){
      panelBody.innerHTML='<p class="problem-row">'+escapeHtml(error.message||"GitHub request failed.")+"</p>";
    }
  }

  async function openRepository(repository){
    const selected=CMGitHub.selectRepository(repository);
    if(!selected)return;

    try{
      const data=await CMGitHub.getRepositoryTree(selected.owner,selected.name,selected.branch);
      const tree=data.tree.filter(item=>item.type==="blob"&&supported(item.path));

      projectName.textContent=selected.full_name;
      document.getElementById("sideTitle").textContent="GITHUB";

      sideContent.innerHTML=
        '<div class="github-repo-head"><b>'+escapeHtml(selected.full_name)+'</b><small>'+escapeHtml(selected.branch)+'</small></div>'+
        '<button class="github-back-btn" id="githubBackBtn" type="button">← Repositories</button>'+
        (tree.length?tree.map(item=>
          '<button class="tree-file github-remote-file" type="button" data-path="'+escapeAttr(item.path)+'">'+
          '<span class="file-icon '+iconClass(item.path)+'">'+iconText(item.path)+'</span>'+
          '<span>'+escapeHtml(item.path)+'</span></button>'
        ).join(""):'<div class="sidebar-note"><b>No code files</b><span>No supported text files were found.</span></div>');

      document.getElementById("githubBackBtn")?.addEventListener("click",repositoriesView);
      sideContent.querySelectorAll(".github-remote-file").forEach(button=>{
        button.addEventListener("click",()=>openRemoteFile(button.dataset.path));
      });

      panelBody.innerHTML='<div>$ github repository</div><p class="success-row">Opened '+escapeHtml(selected.full_name)+".</p>";
    }catch(error){
      panelBody.innerHTML='<p class="problem-row">'+escapeHtml(error.message||"Could not load the repository.")+"</p>";
    }
  }

  async function openRemoteFile(path){
    const selected=CMGitHub.getSelectedRepository();
    if(!selected)return;

    try{
      const data=await CMGitHub.getRepositoryFile(selected.owner,selected.name,path,selected.branch);
      const key=normalizePath(path);
      const shas=readShas();

      files[key]=decodeBase64(data.content);
      shas[key]=data.sha||"";
      writeShas(shas);
      openFile(key);

      panelBody.innerHTML='<div>$ github open</div><p class="success-row">Loaded '+escapeHtml(path)+" from GitHub.</p>";
    }catch(error){
      panelBody.innerHTML='<p class="problem-row">'+escapeHtml(error.message||"Could not open the GitHub file.")+"</p>";
    }
  }

  async function pushFile(){
    const selected=CMGitHub.getSelectedRepository();

    if(!selected||!CMGitHub.isConnected()){
      panelBody.innerHTML='<p class="problem-row">Connect GitHub and choose a repository first.</p>';
      return;
    }

    files[currentFile]=editor.value;

    const message=prompt("Commit message","Update "+currentFile+" from Coding Master");
    if(!message)return;

    const button=document.getElementById("githubPushBtn");
    if(button){button.disabled=true;button.textContent="Pushing...";}

    try{
      const shas=readShas();
      const result=await CMGitHub.saveRepositoryFile(
        selected.owner,
        selected.name,
        currentFile,
        editor.value,
        message,
        selected.branch,
        shas[currentFile]||null
      );

      if(result?.content?.sha){
        shas[currentFile]=result.content.sha;
        writeShas(shas);
      }

      panelBody.innerHTML='<div>$ github push</div><p class="success-row">Commit created for '+escapeHtml(currentFile)+" in "+escapeHtml(selected.full_name)+".</p>";
    }catch(error){
      panelBody.innerHTML='<p class="problem-row">'+escapeHtml(error.message||"GitHub push failed.")+"</p>";
    }finally{
      if(button){button.disabled=false;button.textContent="Push to GitHub";}
    }
  }

  window.addEventListener("cm:github:repositories",repositoriesView);
  document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("githubPushBtn")?.addEventListener("click",pushFile);
  });
})();
