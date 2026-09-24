const files={
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

let currentFile="index.html";
const editor=document.getElementById("codeEditor");
const lines=document.getElementById("lineNumbers");
const preview=document.getElementById("preview");
const breadcrumb=document.getElementById("breadcrumb");
const status=document.getElementById("status");
const panelBody=document.getElementById("panelBody");

try{const saved=JSON.parse(localStorage.getItem("cm-project-files"));if(saved)Object.assign(files,saved)}catch{}

function language(file){return file.endsWith(".css")?"CSS":file.endsWith(".js")?"JavaScript":"HTML"}
function updateLines(){lines.textContent=Array.from({length:Math.max(editor.value.split("\n").length,1)},(_,i)=>i+1).join("\n")}
function save(){
 files[currentFile]=editor.value;
 try{localStorage.setItem("cm-project-files",JSON.stringify(files))}catch{}
 panelBody.innerHTML="<div>$ coding-master save</div><p>تم حفظ "+currentFile+".</p>";
}
function tabs(){
 document.getElementById("tabs").innerHTML='<button class="tab active" type="button">◇ '+currentFile+'<span class="tab-close">×</span></button>';
}
function openFile(file){
 files[currentFile]=editor.value;currentFile=file;editor.value=files[file];
 breadcrumb.textContent="CODING-MASTER / "+file;
 status.textContent="Ln 1, Col 1 • "+language(file)+" • UTF-8";
 document.querySelectorAll(".file").forEach(x=>x.classList.toggle("active",x.dataset.file===file));
 tabs();updateLines();editor.focus();
}
function run(){
 save();
 const html=files["index.html"].replace(/<link[^>]*href=["']style\.css["'][^>]*>/i,"").replace(/<script[^>]*src=["']script\.js["']><\/script>/i,"");
 const css=files["style.css"];
 const jsCode=files["script.js"].replace(/<\/script/gi,"<\\/script");
 preview.srcdoc=html.replace("</head>","<style>"+css+"</style></head>").replace("</body>","<script>"+jsCode+"<\/script></body>");
 panelBody.innerHTML="<div>$ coding-master run</div><p>تم تشغيل المشروع في المعاينة.</p>";
}
document.querySelectorAll(".file").forEach(x=>x.addEventListener("click",()=>openFile(x.dataset.file)));
document.getElementById("runBtn").addEventListener("click",run);
document.getElementById("saveBtn").addEventListener("click",save);
document.getElementById("refreshBtn").addEventListener("click",run);
document.getElementById("previewToggle").addEventListener("click",()=>{const p=document.getElementById("previewPane");p.style.display=p.style.display==="none"?"flex":"none"});
document.getElementById("welcomeBtn").addEventListener("click",()=>{localStorage.removeItem("cm-welcome-seen");location.href="welcome.html"});
document.getElementById("commandBtn").addEventListener("click",()=>{panelBody.innerHTML="<div>⌘K</div><p>استخدم البحث للوصول السريع إلى ملفات وأوامر Coding Master.</p>"});
document.getElementById("settingsBtn").addEventListener("click",()=>{panelBody.innerHTML="<div>⚙ SETTINGS</div><p>الإعدادات ستتم إضافتها تدريجيًا.</p>"});
document.querySelectorAll(".activity[data-view]").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".activity[data-view]").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 const view=btn.dataset.view;
 if(view==="explorer"){document.getElementById("sideTitle").textContent="EXPLORER";location.reload();return}
 document.getElementById("sideTitle").textContent=view.toUpperCase();
 document.getElementById("sideContent").innerHTML='<div class="sidebar-note"><b>'+view.toUpperCase()+'</b><span>هذه المساحة جاهزة للتطوير لاحقًا.</span></div>';
}));
document.querySelectorAll(".panel-tab").forEach(btn=>btn.addEventListener("click",()=>{
 document.querySelectorAll(".panel-tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 panelBody.innerHTML="<div>"+btn.dataset.panel.toUpperCase()+"</div><p>جاهز.</p>";
}));
editor.addEventListener("input",()=>{files[currentFile]=editor.value;updateLines();const pos=editor.selectionStart;status.textContent="Ln "+(editor.value.slice(0,pos).split("\n").length)+", Col "+(pos-editor.value.lastIndexOf("\n",pos-1))+" • "+language(currentFile)+" • UTF-8"});
editor.addEventListener("scroll",()=>{lines.scrollTop=editor.scrollTop});
editor.addEventListener("keydown",e=>{
 if(e.key==="Tab"){e.preventDefault();const s=editor.selectionStart;editor.setRangeText("  ",s,editor.selectionEnd,"end");files[currentFile]=editor.value;updateLines()}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="s"){e.preventDefault();save()}
 if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();run()}
});
openFile("index.html");run();