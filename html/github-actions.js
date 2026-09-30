(function(){
  "use strict";

  const STORE="cm-github-repository";

  function selected(){
    try{return JSON.parse(localStorage.getItem(STORE)||"null");}
    catch{return null;}
  }

  function save(value){
    try{localStorage.setItem(STORE,JSON.stringify(value));}
    catch{}
  }

  async function branches(){
    const r=selected();
    if(!r||!window.CMGitHub?.isConnected())return [];

    return CMGitHub.api("/repos/"+encodeURIComponent(r.owner)+"/"+encodeURIComponent(r.name)+"/branches?per_page=100");
  }

  function addControls(){
    if(document.getElementById("cmGithubRepoControls"))return;

    const r=selected();
    if(!r)return;

    const box=document.createElement("div");
    box.id="cmGithubRepoControls";
    box.className="cm-github-repo-controls";
    box.innerHTML=
      '<div class="cm-github-control-title">REPOSITORY</div>'+
      '<div class="cm-github-control-name">'+escapeHtml(r.full_name)+'</div>'+
      '<div class="cm-github-control-row">'+
        '<select id="cmGithubBranch" class="cm-github-branch"></select>'+
        '<button id="cmGithubPullBtn" class="cm-github-small-btn" type="button">Pull</button>'+
      '</div>';

    sideContent.prepend(box);

    loadBranches();
  }

  async function loadBranches(){
    const select=document.getElementById("cmGithubBranch");
    const r=selected();

    if(!select||!r)return;

    select.innerHTML='<option>Loading branches...</option>';
    select.disabled=true;

    try{
      const list=await branches();
      const items=Array.isArray(list)?list:[];
      select.innerHTML=items.map(item=>
        '<option value="'+escapeAttr(item.name)+'">'+escapeHtml(item.name)+'</option>'
      ).join("");

      if(r.branch)select.value=r.branch;
      if(!select.value && items[0]){
        r.branch=items[0].name;
        save(r);
        select.value=r.branch;
      }

      select.disabled=false;
    }catch(error){
      select.innerHTML='<option>Could not load branches</option>';
      select.disabled=true;
      panelBody.innerHTML='<p class="problem-row">'+escapeHtml(error.message||"Could not load branches.")+"</p>";
    }
  }

  async function changeBranch(event){
    const r=selected();
    if(!r)return;

    r.branch=event.target.value;
    save(r);

    try{
      const data=await CMGitHub.getRepositoryTree(r.owner,r.name,r.branch);
      const tree=data.tree.filter(item=>item.type==="blob");
      panelBody.innerHTML='<div>$ github branch</div><p class="success-row">Switched to '+escapeHtml(r.branch)+" • "+tree.length+" item(s).</p>";
    }catch(error){
      panelBody.innerHTML='<p class="problem-row">'+escapeHtml(error.message||"Could not switch branch.")+"</p>";
    }

    window.dispatchEvent(new CustomEvent("cm:github:branch-changed",{detail:r}));
  }

  async function pullCurrent(){
    const r=selected();
    if(!r||!currentFile){
      panelBody.innerHTML='<p class="problem-row">Choose a GitHub repository first.</p>';
      return;
    }

    try{
      const data=await CMGitHub.getRepositoryFile(r.owner,r.name,currentFile,r.branch);
      const binary=atob(String(data.content||"").replace(/\n/g,""));
      const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
      const remote=new TextDecoder("utf-8").decode(bytes);

      files[currentFile]=remote;
      editor.value=remote;
      renderSyntax();

      const shas=JSON.parse(localStorage.getItem("cm-github-file-shas")||"{}");
      shas[currentFile]=data.sha||"";
      localStorage.setItem("cm-github-file-shas",JSON.stringify(shas));

      panelBody.innerHTML='<div>$ github pull</div><p class="success-row">Pulled '+escapeHtml(currentFile)+" from "+escapeHtml(r.branch)+".</p>";
    }catch(error){
      panelBody.innerHTML='<p class="problem-row">'+escapeHtml(error.message||"Pull failed.")+"</p>";
    }
  }

  function escapeHtml(value){
    return String(value??"").replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  }

  function escapeAttr(value){
    return escapeHtml(value).replace(/'/g,"&#039;");
  }

  document.addEventListener("DOMContentLoaded",()=>{
    document.addEventListener("click",event=>{
      if(event.target?.id==="githubPushBtn")return;

      const githubButton=event.target.closest('.activity[data-view="github"]');
      if(githubButton){
        setTimeout(addControls,350);
      }
    });

    sideContent?.addEventListener("click",event=>{
      if(event.target?.id==="cmGithubPullBtn")pullCurrent();
    });

    sideContent?.addEventListener("change",event=>{
      if(event.target?.id==="cmGithubBranch")changeBranch(event);
    });

    window.addEventListener("cm:github:repository-selected",()=>{
      setTimeout(addControls,100);
    });

    window.addEventListener("cm:github:branch-selected",()=>{
      setTimeout(addControls,100);
    });
  });
})();