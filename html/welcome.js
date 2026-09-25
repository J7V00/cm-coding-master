const STARTUP_KEY="cm-welcome-seen";
const RECENT_KEY="cm-recent-projects";
const filePicker=document.getElementById("filePicker");
const folderPicker=document.getElementById("folderPicker");
const recentList=document.getElementById("recentList");

function getRecent(){
  try{return JSON.parse(localStorage.getItem(RECENT_KEY))||[]}
  catch{return[]}
}

function saveRecent(name,detail){
  const items=getRecent().filter(x=>x.name!==name);
  items.unshift({name,detail,date:Date.now()});
  localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,6)));
  renderRecent();
}

function renderRecent(){
  const items=getRecent();

  if(!items.length){
    recentList.innerHTML='<div class="empty-recent">No recent projects yet.</div>';
    return;
  }

  recentList.innerHTML=items.map((x,i)=>
    '<button class="recent-item" data-index="'+i+'" type="button">'+
      '<span><strong>'+escapeHtml(x.name)+'</strong><small>'+escapeHtml(x.detail||"Coding Master")+'</small></span>'+
      '<small>→</small>'+
    '</button>'
  ).join("");

  recentList.querySelectorAll(".recent-item").forEach(btn=>{
    btn.addEventListener("click",()=>{
      localStorage.setItem(STARTUP_KEY,"1");
      window.location.href="editor.html";
    });
  });
}

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    """:"&quot;",
    "'":"&#039;"
  }[c]));
}

function goEditor(){
  localStorage.setItem(STARTUP_KEY,"1");
  saveRecent("My Latest Project","Coding Master");
  window.location.href="editor.html";
}

async function importFiles(fileList){
  const incoming={};

  for(const file of [...fileList]){
    try{incoming[file.name]=await file.text()}catch{}
  }

  if(!Object.keys(incoming).length)return;

  const old=JSON.parse(localStorage.getItem("cm-project-files")||"{}");
  Object.assign(old,incoming);
  localStorage.setItem("cm-project-files",JSON.stringify(old));
  localStorage.setItem(STARTUP_KEY,"1");
  saveRecent(
    fileList[0]?.webkitRelativePath?.split("/")[0]||fileList[0]?.name||"Imported Project",
    "Imported files"
  );
  window.location.href="editor.html";
}

document.getElementById("continueBtn").addEventListener("click",goEditor);

document.getElementById("openFileBtn").addEventListener("click",()=>{
  filePicker.click();
});

document.getElementById("openFolderBtn").addEventListener("click",()=>{
  folderPicker.click();
});

document.getElementById("newFileBtn").addEventListener("click",()=>{
  localStorage.removeItem(STARTUP_KEY);
  localStorage.setItem("cm-new-file","index.html");
  window.location.href="editor.html";
});

filePicker.addEventListener("change",e=>importFiles(e.target.files));
folderPicker.addEventListener("change",e=>importFiles(e.target.files));

document.getElementById("clearRecentBtn").addEventListener("click",()=>{
  localStorage.removeItem(RECENT_KEY);
  renderRecent();
});

document.getElementById("helpBtn").addEventListener("click",()=>{
  window.location.href="editor.html";
});

document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="o"){
    e.preventDefault();
    filePicker.click();
  }

  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="n"){
    e.preventDefault();
    document.getElementById("newFileBtn").click();
  }
});

renderRecent();