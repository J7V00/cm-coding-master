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

document.getElementById("openFileBtn")?.addEventListener("click",()=>{
  filePicker.click();
});

document.getElementById("openFolderBtn")?.addEventListener("click",()=>{
  folderPicker.click();
});

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

  if(mod&&event.key.toLowerCase()==="o"){
    event.preventDefault();
    filePicker?.click();
  }

  if(mod&&event.key.toLowerCase()==="n"){
    event.preventDefault();
    document.getElementById("newFileBtn")?.click();
  }
});