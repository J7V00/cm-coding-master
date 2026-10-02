const STARTUP_KEY="cm-welcome-seen";
const RECENT_KEY="cm-recent-projects";

const filePicker=document.getElementById("filePicker");
const folderPicker=document.getElementById("folderPicker");

function normalizePath(value){
  return String(value||"").replace(/\\/g,"/").replace(/^\.\//,"").replace(/^\//,"");
}

function saveRecent(name,detail){
  try{
    const items=JSON.parse(localStorage.getItem(RECENT_KEY)||"[]").filter(item=>item.name!==name);
    items.unshift({name,detail,date:Date.now()});
    localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,6)));
  }catch{}
}

function goEditor(){
  localStorage.setItem(STARTUP_KEY,"1");
  saveRecent("My Latest Project","Coding Master");
  window.location.href="editor.html";
}

async function importFiles(fileList){
  const incoming={};
  let projectRoot="CODING-MASTER";

  for(const file of [...fileList]){
    try{
      const relative=file.webkitRelativePath
        ? normalizePath(file.webkitRelativePath)
        : normalizePath(file.name);

      if(file.webkitRelativePath){
        projectRoot=relative.split("/")[0]||projectRoot;
      }

      const parts=relative.split("/");
      const path=parts.length>1?parts.slice(1).join("/"):parts[0];

      if(path) incoming[path]=await file.text();
    }catch{}
  }

  if(!Object.keys(incoming).length)return;

  try{
    localStorage.setItem("cm-project-files",JSON.stringify(incoming));
    localStorage.setItem("cm-project-root",projectRoot);
    localStorage.setItem("cm-was-imported","1");
    localStorage.setItem(STARTUP_KEY,"1");
  }catch{}

  window.location.href="editor.html";
}

document.getElementById("continueBtn")?.addEventListener("click",goEditor);

document.getElementById("heroOpenBtn")?.addEventListener("click",()=>{
  filePicker.click();
});

async function openNativeFile(){
  if(!window.CMDesktop?.isTauri()){
    filePicker?.click();
    return;
  }

  const picked=await CMDesktop.openFile();
  if(!picked)return;

  localStorage.setItem("cm-project-files",JSON.stringify({
    [picked.name]:picked.content
  }));
  localStorage.setItem("cm-native-file-paths",JSON.stringify({
    [picked.name]:picked.path
  }));
  localStorage.setItem("cm-native-root-path",await CMDesktop.join(picked.path,".."));
  localStorage.setItem("cm-project-root",String(picked.path).replace(/\\/g,"/").split("/").pop()||"CODING-MASTER");
  localStorage.setItem("cm-project-folders",JSON.stringify([]));
  localStorage.setItem(STARTUP_KEY,"1");
  localStorage.setItem("cm-was-imported","1");
  window.location.href="editor.html";
}

async function openNativeFolder(){
  if(!window.CMDesktop?.isTauri()){
    folderPicker?.click();
    return;
  }

  const project=await CMDesktop.openFolder();
  if(!project)return;

  if(!Object.keys(project.files).length){
    alert("No supported code files were found in this folder.");
    return;
  }

  localStorage.setItem("cm-project-files",JSON.stringify(project.files));
  localStorage.setItem("cm-native-file-paths",JSON.stringify(project.nativePaths));
  localStorage.setItem("cm-native-root-path",project.rootPath||"");
  localStorage.setItem("cm-project-root",project.rootName||"CODING-MASTER");
  localStorage.setItem("cm-project-folders",JSON.stringify(project.folders||[]));
  localStorage.setItem(STARTUP_KEY,"1");
  localStorage.setItem("cm-was-imported","1");
  window.location.href="editor.html";
}

document.getElementById("openFileBtn")?.addEventListener("click",openNativeFile);
document.getElementById("openFolderBtn")?.addEventListener("click",openNativeFolder);

document.getElementById("newFileBtn")?.addEventListener("click",()=>{
  localStorage.removeItem(STARTUP_KEY);
  localStorage.setItem("cm-new-file","index.html");
  window.location.href="editor.html";
});

filePicker?.addEventListener("change",event=>{
  importFiles(event.target.files);
  event.target.value="";
});

folderPicker?.addEventListener("change",event=>{
  importFiles(event.target.files);
  event.target.value="";
});

document.getElementById("helpBtn")?.addEventListener("click",goEditor);

document.addEventListener("keydown",event=>{
  const mod=event.metaKey||event.ctrlKey;

  if(mod&&event.key.toLowerCase()==="o"&&event.shiftKey){
    event.preventDefault();
    openNativeFolder();
  }else if(mod&&event.key.toLowerCase()==="o"){
    event.preventDefault();
    openNativeFile();
  }

  if(mod&&event.key.toLowerCase()==="n"){
    event.preventDefault();
    document.getElementById("newFileBtn")?.click();
  }
});