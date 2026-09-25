const DEFAULT_FILES={
"index.html":`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Coding Master</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<main class="card">
<span>CODING MASTER</span>
<h1>مرحبًا بك 👋</h1>
<p>ابدأ بكتابة فكرتك هنا.</p>
<button onclick="hello()">جرّب JavaScript</button>
</main>
<script src="script.js"><\/script>
</body>
</html>`,
"style.css":`*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#fff;font-family:Arial,sans-serif}
.card{width:min(520px,calc(100% - 40px));padding:34px;border:1px solid #333;border-radius:18px;background:#151515}
button{padding:10px 14px;border:0;border-radius:8px;cursor:pointer}`,
"script.js":`function hello(){alert("JavaScript يعمل ✅");}`
};
const FILES_KEY="cm-project-files";
let files={...DEFAULT_FILES};
try{const saved=JSON.parse(localStorage.getItem(FILES_KEY));if(saved)Object.assign(files,saved)}catch{}
let currentFile="index.html";
let openFiles=["index.html"];
const editor=document.getElementById("codeEditor");
const lines=document.getElementById("lineNumbers");
const preview=document.getElementById("preview");
const breadcrumb=document.getElementById("breadcrumb");
const status=document.getElementById("status");
const panelBody=document.getElementById("panelBody");
const sideContent=document.getElementById("sideContent");
const filePicker=document.getElementById("filePicker");
const folderPicker=document.getElementById("folderPicker");

function language(file){if(file.endsWith(".css"))return"CSS";if(file.endsWith(".js"))return"JavaScript";if(file.endsWith(".json"))return"JSON";return"HTML"}
function saveStore(){try{localStorage.setItem(FILES_KEY,JSON.stringify(files))}catch{}}
function updateLines(){lines.textContent=Array.from({length:Math.max(editor.value.split("\n").length,1)},(_,i)=>i+1).join("\n")}
function save(){
 files[currentFile]=editor.value;saveStore();
 panelBody.innerHTML="<div>$ coding-master save</div><p>Saved "+currentFile+".</p>";
}
function renderExplorer(){
 const names=Object.keys(files).filter(Boolean).sort((a,b)=>a==="index.html"?-1:b==="index.html"?1:a.localeCompare(b));
 sideContent.innerHTML='<div class="folder">CODING-MASTER <span>⌄</span></div>'+
 names.map(name=>'<button class="file '+(name===currentFile?"active":"")+'" data-file="'+escapeAttr(name)+'" type="button"><span class="file-icon '+language(name).toLowerCase()+'">◇</span> '+escapeHtml(name)+'</button>').join("");
 sideContent.querySelectorAll(".file").forEach(x=>x.addEventListener("click",()=>openFile(x.dataset.file)));
}
function renderTabs(){
 document.getElementById("tabs").innerHTML=openFiles.map(file=>'<button class="tab '+(file===currentFile?"active":"")+'" data-file="'+escapeAttr(file)+'" type="button">◇ '+escapeHtml(file)+'<span class="tab-close">×</span></button>').join("");
 document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",e=>{
   if(e.target.classList.contains("tab-close")){closeTab(tab.dataset.file);return}
   openFile(tab.dataset.file);
 }));
}
function openFile(file){
 if(!(file in files))files[file]="";
 files[currentFile]=editor.value;
 currentFile=file;
 if(!openFiles.includes(file))openFiles.push(file);
 editor.value=files[file];
 breadcrumb.textContent="CODING-MASTER / "+file;
 status.textContent="Ln 1, Col 1 • "+language(file)+" • UTF-8";
 renderExplorer();renderTabs();updateLines();editor.focus();
}
function closeTab(file){
 if(openFiles.length===1)return;
 openFiles=openFiles.filter(x=>x!==file);
 if(currentFile===file)currentFile=openFiles[openFiles.length-1];
 openFile(currentFile);
}
function addImportedFile(fileName,text){
 files[fileName]=text;
 if(!openFiles.includes(fileName))openFiles.push(fileName);
 currentFile=fileName;
 saveStore();renderExplorer();renderTabs();editor.value=text;breadcrumb.textContent="CODING-MASTER / "+fileName;updateLines();
}
async function importFiles(list){
 let count=0;
 for(const file of [...list]){
   try{addImportedFile(file.name,await file.text());count++}catch{}
 }
 if(count){localStorage.setItem("cm-was-imported","1");panelBody.innerHTML="<div>$ coding-master import</div><p>Imported "+count+" file(s).</p>";}
}
function newFile(){
 const name=prompt("اسم الملف الجديد","untitled.html");
 if(!name)return;
 if(name in files){openFile(name);return}
 files[name]="";openFiles.push(name);openFile(name);
}
function run(){
 save();
 const html=(files["index.html"]||"").replace(/<link[^>]*href=["']style\.css["'][^>]*>/i,"").replace(/<script[^>]*src=["']script\.js["']><\/script>/i,"");
 const css=files["style.css"]||"";
 const js=(files["script.js"]||"").replace(/<\/script/gi,"<\\/script");
 preview.srcdoc=html.replace("</head>","<style>"+css+"</style></head>").replace("</body>","<script>"+js+"<\/script></body>");
 panelBody.innerHTML="<div>$ coding-master run</div><p>Project is running in preview.</p>";
}
function escapeHtml(v){return String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function escapeAttr(v){return escapeHtml(v)}

document.getElementById("newFileBtn").addEventListener("click",newFile);
document.getElementById("openFileBtn").addEventListener("click",()=>filePicker.click());
filePicker.addEventListener("change",e=>importFiles(e.target.files));
folderPicker.addEventListener("change",e=>importFiles(e.target.files));
document.getElementById("runBtn").addEventListener("click",run);
document.getElementById("saveBtn").addEventListener("click",save);
document.getElementById("refreshBtn").addEventListener("click",run);
document.getElementById("previewToggle").addEventListener("click",()=>{const p=document.getElementById("previewPane");p.style.display=p.style.display==="none"?"flex":"none"});
document.getElementById("welcomeBtn").addEventListener("click",()=>{localStorage.removeItem("cm-welcome-seen");location.href="welcome.html"});
document.getElementById("commandBtn").addEventListener("click",()=>{panelBody.innerHTML="<div>⌘K</div><p>ملف جديد • فتح ملف • حفظ • تشغيل • معاينة</p>"});
document.getElementById("settingsBtn").addEventListener("click",()=>{panelBody.innerHTML="<div>⚙ SETTINGS</div><p>Settings will be added gradually.</p>"});
document.querySelectorAll(".activity[data-view]").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".activity[data-view]").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 const view=btn.dataset.view;
 document.getElementById("sideTitle").textContent=view==="explorer"?"EXPLORER":view.toUpperCase();
 if(view==="explorer"){renderExplorer();return}
 sideContent.innerHTML='<div class="sidebar-note"><b>'+view.toUpperCase()+'</b><span>This space is ready for development.</span></div>';
}));
document.querySelectorAll(".panel-tab").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".panel-tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 panelBody.innerHTML="<div>"+btn.dataset.panel.toUpperCase()+"</div><p>Ready.</p>";
}));
editor.addEventListener("input",()=>{
 files[currentFile]=editor.value;updateLines();
 const pos=editor.selectionStart;
 status.textContent="Ln "+(editor.value.slice(0,pos).split("\n").length)+", Col "+(pos-editor.value.lastIndexOf("\n",pos-1))+" • "+language(currentFile)+" • UTF-8";
});
editor.addEventListener("scroll",()=>{lines.scrollTop=editor.scrollTop});
editor.addEventListener("keydown",e=>{
 if(e.key==="Tab"){e.preventDefault();const s=editor.selectionStart;editor.setRangeText("  ",s,editor.selectionEnd,"end");files[currentFile]=editor.value;updateLines()}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="s"){e.preventDefault();save()}
 if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();run()}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="o"){e.preventDefault();filePicker.click()}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="n"){e.preventDefault();newFile()}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="w"){e.preventDefault();closeTab(currentFile)}
});
document.addEventListener("dragover",e=>e.preventDefault());
document.addEventListener("drop",e=>{e.preventDefault();if(e.dataTransfer?.files?.length)importFiles(e.dataTransfer.files)});

renderExplorer();renderTabs();openFile(currentFile);run();