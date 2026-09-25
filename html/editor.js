const FILES_KEY="cm-project-files";
const ROOT_KEY="cm-project-root";
const FOLDERS_KEY="cm-project-folders";

const DEFAULT_FILES={
  "index.html":"<!DOCTYPE html>\n<html lang=\"ar\" dir=\"rtl\">\n<head>\n<meta charset=\"UTF-8\">\n<title>Coding Master</title>\n<link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n<main class=\"card\">\n<h1>مرحبًا بك 👋</h1>\n<p>ابدأ بكتابة فكرتك هنا.</p>\n<button onclick=\"hello()\">جرّب JavaScript</button>\n</main>\n<script src=\"script.js\"><\\/script>\n</body>\n</html>",
  "style.css":"*{box-sizing:border-box}\nbody{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#fff;font-family:Arial,sans-serif}\n.card{width:min(520px,calc(100% - 40px));padding:34px;border:1px solid #333;border-radius:18px;background:#151515}\nbutton{padding:10px 14px;border:0;border-radius:8px;cursor:pointer}",
  "script.js":"function hello(){alert(\"JavaScript يعمل ✅\");}"
};

let files={...DEFAULT_FILES};
let folders=new Set();
let activeFolder="";
let currentFile="index.html";
let openFiles=["index.html"];
let projectRoot=localStorage.getItem(ROOT_KEY)||"CODING-MASTER";

try{
  const saved=JSON.parse(localStorage.getItem(FILES_KEY));
  if(saved&&typeof saved==="object"&&Object.keys(saved).length){
    files={...DEFAULT_FILES,...saved};
  }
}catch{}

const editor=document.getElementById("codeEditor");
const syntaxLayer=document.getElementById("syntaxLayer");
const lines=document.getElementById("lineNumbers");
const preview=document.getElementById("preview");
const breadcrumb=document.getElementById("breadcrumb");
const status=document.getElementById("status");
const panelBody=document.getElementById("panelBody");
const sideContent=document.getElementById("sideContent");
const filePicker=document.getElementById("filePicker");
const folderPicker=document.getElementById("folderPicker");
const problemCount=document.getElementById("problemCount");
const projectName=document.getElementById("projectName");

function normalizePath(value){
  return String(value||"").replace(/\\/g,"/").replace(/^\.\/+/,"").replace(/^\/+/,"");
}

try{
  const savedFolders=JSON.parse(localStorage.getItem(FOLDERS_KEY)||"[]");
  if(Array.isArray(savedFolders)){
    savedFolders.filter(Boolean).forEach(folder=>folders.add(normalizePath(folder)));
  }
}catch{}

function baseName(path){
  const parts=normalizePath(path).split("/");
  return parts[parts.length-1]||path;
}

function extension(path){
  const name=baseName(path).toLowerCase();
  const dot=name.lastIndexOf(".");
  return dot===-1?"":name.slice(dot+1);
}

function language(file){
  const ext=extension(file);
  if(ext==="css")return"CSS";
  if(["js","jsx","ts","tsx"].includes(ext))return"JavaScript";
  if(ext==="json")return"JSON";
  if(["md","txt","xml","svg"].includes(ext))return"Text";
  return"HTML";
}

function iconClass(file){
  const ext=extension(file);
  if(["html","htm"].includes(ext))return"html";
  if(ext==="css")return"css";
  if(["js","jsx","ts","tsx"].includes(ext))return"js";
  if(ext==="json")return"json";
  return"text";
}

function iconText(file){
  const ext=extension(file);
  if(["html","htm"].includes(ext))return"<>";
  if(ext==="css")return"CSS";
  if(["js","jsx","ts","tsx"].includes(ext))return"JS";
  if(ext==="json")return"{}";
  return"TXT";
}

function saveStore(){
  try{
    localStorage.setItem(FILES_KEY,JSON.stringify(files));
    localStorage.setItem(ROOT_KEY,projectRoot);
    localStorage.setItem(FOLDERS_KEY,JSON.stringify([...folders]));
  }catch{}
}

function addFolderAndParents(path){
  const clean=normalizePath(path);
  if(!clean)return;

  const parts=clean.split("/").filter(Boolean);

  for(let i=1;i<=parts.length;i++){
    folders.add(parts.slice(0,i).join("/"));
  }
}

function parentFolder(path){
  const clean=normalizePath(path);
  const slash=clean.lastIndexOf("/");
  return slash===-1?"":clean.slice(0,slash);
}

function escapeHtml(value){
  return String(value).replace(/[&<>"]/g,character=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;"
  }[character]));
}

function escapeAttr(value){
  return escapeHtml(value).replace(/'/g,"&#039;");
}

function addErrorLines(html,errorLines){
  if(!errorLines.length)return html;
  return html.split("\n").map((line,index)=>{
    return errorLines.includes(index+1)
      ? '<span class="syn-error">'+line+"</span>"
      : line;
  }).join("\n");
}

function lintCode(code,lang){
  const linesWithProblems=new Set();
  const messages=[];

  if(lang==="HTML"){
    const stack=[];
    const voidTags=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
    const pattern=/<\s*\/?\s*([A-Za-z0-9:-]+)[^>]*>/g;
    let match;

    while((match=pattern.exec(code))){
      const raw=match[0];
      if(raw.startsWith("<!--"))continue;

      const name=match[1].toLowerCase();
      const line=code.slice(0,match.index).split("\n").length;

      if(/^<\s*\//.test(raw)){
        const index=stack.map(item=>item.name).lastIndexOf(name);

        if(index===-1){
          linesWithProblems.add(line);
          messages.push("Closing tag </"+name+"> has no matching opening tag.");
        }else{
          stack.splice(index,stack.length-index);
        }
      }else if(!voidTags.has(name)&&!/\s*\/>$/.test(raw)){
        stack.push({name,line});
      }
    }

    stack.forEach(item=>{
      linesWithProblems.add(item.line);
      messages.push("Tag <"+item.name+"> is not closed.");
    });
  }

  if(lang==="CSS"){
    const sourceLines=code.split("\n");
    let balance=0;

    sourceLines.forEach((line,index)=>{
      for(const char of line){
        if(char==="{")balance++;
        if(char==="}")balance--;
        if(balance<0){
          linesWithProblems.add(index+1);
          messages.push("Unexpected }.");
          balance=0;
        }
      }
    });

    if(balance>0){
      linesWithProblems.add(sourceLines.length);
      messages.push("Missing }.");
    }

    sourceLines.forEach((line,index)=>{
      const clean=line.trim();
      if(clean&&!clean.startsWith("/*")&&!clean.startsWith("*")&&!clean.startsWith("@")&&clean.includes("{")===false&&clean.includes("}")===false&&clean.includes(":")===false){
        if(/[A-Za-z-]+\s+[A-Za-z-]+/.test(clean)){
          linesWithProblems.add(index+1);
          messages.push("CSS declaration looks incomplete.");
        }
      }
    });
  }

  if(lang==="JavaScript"){
    const sourceLines=code.split("\n");
    const pairs=[["{","}"],["[","]"],["(",")"]];

    for(const [open,close] of pairs){
      let balance=0;

      sourceLines.forEach((line,index)=>{
        for(const char of line){
          if(char===open)balance++;
          if(char===close)balance--;
          if(balance<0){
            linesWithProblems.add(index+1);
            messages.push("Unexpected "+close+".");
            balance=0;
          }
        }
      });

      if(balance>0){
        linesWithProblems.add(sourceLines.length);
        messages.push("Missing "+close+".");
      }
    }

    for(const quote of ['"',"'"]){
      let escaped=false;
      let open=false;
      let lineNumber=1;

      for(let i=0;i<code.length;i++){
        const char=code[i];

        if(char==="\n")lineNumber++;

        if(escaped){
          escaped=false;
          continue;
        }

        if(char==="\\"){
          escaped=true;
          continue;
        }

        if(char===quote){
          open=!open;
        }
      }

      if(open){
        linesWithProblems.add(lineNumber);
        messages.push("Unclosed string.");
      }
    }
  }

  if(lang==="JSON"){
    try{
      JSON.parse(code);
    }catch(error){
      const message=String(error&&error.message||"Invalid JSON");
      messages.push(message);
      const positionMatch=message.match(/position\s+(\d+)/i);
      const position=positionMatch?Number(positionMatch[1]):0;
      linesWithProblems.add(code.slice(0,position).split("\n").length);
    }
  }

  return{
    lines:[...linesWithProblems],
    messages:[...new Set(messages)].slice(0,8)
  };
}

function highlightHtml(code){
  const token=/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  let result="";
  let cursor=0;
  let match;

  while((match=token.exec(code))){
    result+=escapeHtml(code.slice(cursor,match.index));
    const raw=match[0];

    if(raw.startsWith("<!--")){
      result+='<span class="syn-comment">'+escapeHtml(raw)+"</span>";
    }else{
      const opening=raw.match(/^(<\s*\/?\s*)([A-Za-z0-9:-]+)/);

      if(!opening){
        result+='<span class="syn-punc">'+escapeHtml(raw)+"</span>";
      }else{
        let inner='<span class="syn-punc">'+escapeHtml(opening[1])+"</span>";
        inner+='<span class="syn-tag">'+escapeHtml(opening[2])+"</span>";

        const rest=raw.slice(opening[0].length);
        const attrRegex=/([A-Za-z_:][\w:.-]*)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s>]+)?/g;
        let aMatch;
        let attrCursor=0;

        while((aMatch=attrRegex.exec(rest))){
          inner+=escapeHtml(rest.slice(attrCursor,aMatch.index));
          inner+='<span class="syn-attr">'+escapeHtml(aMatch[1])+"</span>";

          if(aMatch[2]){
            inner+='<span class="syn-punc">'+escapeHtml(aMatch[2])+"</span>";
          }

          if(aMatch[3]){
            const cls=/^["']/.test(aMatch[3])?"syn-string":"syn-value";
            inner+='<span class="'+cls+'">'+escapeHtml(aMatch[3])+"</span>";
          }

          attrCursor=attrRegex.lastIndex;
        }

        inner+=escapeHtml(rest.slice(attrCursor));
        result+=inner;
      }
    }

    cursor=match.index+raw.length;
  }

  result+=escapeHtml(code.slice(cursor));

  const lint=lintCode(code,"HTML");
  return addErrorLines(result,lint.lines);
}

function highlightCss(code){
  let result=escapeHtml(code);

  result=result.replace(/(\/\*[\s\S]*?\*\/)/g,'<span class="syn-comment">$1</span>');
  result=result.replace(/(^|[\n}])([^{}\n]+)(?={)/g,(match,prefix,selector)=>{
    return prefix+'<span class="syn-selector">'+selector+"</span>";
  });
  result=result.replace(/([A-Za-z-]+)(\s*):/g,'<span class="syn-property">$1</span>$2<span class="syn-punc">:</span>');
  result=result.replace(/(:\s*)([^;{}\n]+)/g,'$1<span class="syn-value">$2</span>');
  result=result.replace(/("[^"]*"|'[^']*')/g,'<span class="syn-string">$1</span>');
  result=result.replace(/\b\d+(?:\.\d+)?\b/g,'<span class="syn-number">$&</span>');

  const lint=lintCode(code,"CSS");
  return addErrorLines(result,lint.lines);
}

function highlightJs(code){
  let result=escapeHtml(code);

  result=result.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g,'<span class="syn-comment">$1</span>');
  result=result.replace(/("[^"]*"|'[^']*')/g,'<span class="syn-string">$1</span>');
  result=result.replace(/\b(?:const|let|var|function|return|if|else|for|while|new|class|extends|import|from|export|default|async|await|true|false|null|undefined|try|catch|throw)\b/g,'<span class="syn-keyword">$&</span>');
  result=result.replace(/\b\d+(?:\.\d+)?\b/g,'<span class="syn-number">$&</span>');

  const lint=lintCode(code,"JavaScript");
  return addErrorLines(result,lint.lines);
}

function highlightJson(code){
  let result=escapeHtml(code);

  result=result.replace(/("(?:\\.|[^"\\])*")\s*:/g,'<span class="syn-property">$1</span><span class="syn-punc">:</span>');
  result=result.replace(/"(?:\\.|[^"\\])*"/g,'<span class="syn-string">$&</span>');
  result=result.replace(/\b(?:true|false|null)\b/g,'<span class="syn-keyword">$&</span>');
  result=result.replace(/\b-?\d+(?:\.\d+)?\b/g,'<span class="syn-number">$&</span>');

  const lint=lintCode(code,"JSON");
  return addErrorLines(result,lint.lines);
}

function highlightCode(code,file){
  const lang=language(file);

  if(lang==="CSS")return highlightCss(code);
  if(lang==="JavaScript")return highlightJs(code);
  if(lang==="JSON")return highlightJson(code);
  if(lang==="HTML")return highlightHtml(code);

  return escapeHtml(code);
}

function updateLines(){
  const count=Math.max(editor.value.split("\n").length,1);
  const lint=lintCode(editor.value,language(currentFile));
  let html="";

  for(let i=1;i<=count;i++){
    html+=lint.lines.includes(i)
      ? '<span class="problem-line">'+i+"</span>"
      : i;

    if(i<count)html+="\n";
  }

  lines.innerHTML=html;
  problemCount.textContent=String(lint.lines.length);
  return lint;
}

function updateStatus(){
  const position=editor.selectionStart;
  const before=editor.value.slice(0,position);
  const line=before.split("\n").length;
  const lastBreak=before.lastIndexOf("\n");
  const col=position-(lastBreak+1)+1;
  const lint=lintCode(editor.value,language(currentFile));

  status.textContent="Ln "+line+", Col "+col+" • "+language(currentFile)+" • UTF-8"+(lint.lines.length?" • "+lint.lines.length+" problem(s)":"");
}

function renderSyntax(){
  syntaxLayer.innerHTML=highlightCode(editor.value,currentFile)||" ";
  updateLines();
  updateStatus();
}

function save(){
  files[currentFile]=editor.value;
  saveStore();
  renderExplorer();
  renderTabs();

  const lint=lintCode(editor.value,language(currentFile));

  panelBody.innerHTML='<div>$ coding-master save</div><p class="'+
    (lint.lines.length?"problem-row":"success-row")+
    '">'+
    (lint.lines.length
      ? "Saved with "+lint.lines.length+" problem(s)."
      : "Saved "+escapeHtml(currentFile)+".")+
    "</p>";
}

function renderExplorer(){
  const entries=Object.keys(files)
    .filter(Boolean)
    .map(normalizePath)
    .sort((a,b)=>a.localeCompare(b));

  const folderList=[...folders];
  const seen=new Set(folders);

  entries.forEach(path=>{
    const parts=path.split("/");

    if(parts.length>1){
      for(let i=1;i<parts.length;i++){
        const folder=parts.slice(0,i).join("/");

        if(!seen.has(folder)){
          seen.add(folder);
          folderList.push(folder);
        }
      }
    }
  });

  const folderHtml=[...new Set(folderList)].sort((a,b)=>a.localeCompare(b)).map(folder=>{
    const depth=folder.split("/").length-1;

    return '<button class="tree-folder" data-folder="'+escapeAttr(folder)+
      '" style="padding-left:'+(10+depth*14)+"px\" type=\"button\">▾ "+
      escapeHtml(baseName(folder))+"</button>";
  }).join("");

  const fileHtml=entries.map(path=>{
    const depth=path.split("/").length-1;

    return '<button class="tree-file '+(path===currentFile?"active":"")+
      '" data-file="'+escapeAttr(path)+
      '" style="padding-left:'+(10+depth*14)+"px\" type=\"button\">"+
      '<span class="file-icon '+iconClass(path)+'">'+iconText(path)+"</span>"+
      "<span>"+escapeHtml(baseName(path))+"</span></button>";
  }).join("");

  sideContent.innerHTML=
    '<div class="project-root">⌄ '+escapeHtml(projectRoot)+"</div>"+
    folderHtml+
    fileHtml;

  sideContent.querySelectorAll(".tree-file").forEach(button=>{
    button.addEventListener("click",()=>openFile(button.dataset.file));

    button.addEventListener("dragstart",event=>{
      event.dataTransfer.setData("text/cm-file",button.dataset.file);
      event.dataTransfer.effectAllowed="move";
      button.classList.add("dragging");
    });

    button.addEventListener("dragend",()=>{
      button.classList.remove("dragging");
    });
  });

  sideContent.querySelectorAll(".tree-folder").forEach(button=>{
    const folder=button.dataset.folder;

    button.addEventListener("click",()=>{
      activeFolder=folder;
    });

    button.addEventListener("dragover",event=>{
      if(event.dataTransfer.types.includes("text/cm-file")){
        event.preventDefault();
        event.dataTransfer.dropEffect="move";
        button.classList.add("drop-target");
      }
    });

    button.addEventListener("dragleave",()=>{
      button.classList.remove("drop-target");
    });

    button.addEventListener("drop",event=>{
      event.preventDefault();
      button.classList.remove("drop-target");

      const source=event.dataTransfer.getData("text/cm-file");
      if(source)moveFileToFolder(source,folder);
    });
  });
}

function moveFileToFolder(source,targetFolder){
  source=normalizePath(source);
  targetFolder=normalizePath(targetFolder);

  if(!source||!(source in files)||!targetFolder)return;

  const next=targetFolder+"/"+baseName(source);

  if(next===source)return;

  if(next in files){
    panelBody.innerHTML='<p class="problem-row">That file already exists in the target folder.</p>';
    return;
  }

  files[next]=files[source];
  delete files[source];

  openFiles=openFiles.map(file=>file===source?next:file);
  if(currentFile===source)currentFile=next;

  addFolderAndParents(targetFolder);
  saveStore();
  renderExplorer();
  renderTabs();

  editor.value=files[currentFile]||"";
  breadcrumb.textContent=currentFile.replace(///g," / ");
  renderSyntax();
}function newFolder(parent=""){
  const raw=prompt("Folder name","html");
  if(!raw)return;

  let name=normalizePath(raw.trim());
  if(!name)return;

  const path=parent&&!name.includes("/")
    ? normalizePath(parent)+"/"+name
    : name;

  addFolderAndParents(path);
  activeFolder=path;
  saveStore();
  renderExplorer();

  panelBody.innerHTML='<div>$ coding-master folder</div><p class="success-row">Created '+escapeHtml(path)+'.</p>';
}


function renderTabs(){
  const tabs=document.getElementById("tabs");

  tabs.innerHTML=openFiles.map(file=>{
    return '<button class="tab '+(file===currentFile?"active":"")+
      '" data-file="'+escapeAttr(file)+'" type="button">'+
      '<span class="tab-icon '+iconClass(file)+'">'+iconText(file)+"</span>"+
      "<span>"+escapeHtml(baseName(file))+"</span>"+
      '<span class="tab-close">×</span></button>';
  }).join("");

  tabs.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click",event=>{
      if(event.target.classList.contains("tab-close")){
        closeTab(tab.dataset.file);
        return;
      }

      openFile(tab.dataset.file);
    });
  });
}

function firstIndexFile(){
  const exact=Object.keys(files).find(path=>normalizePath(path).toLowerCase()==="index.html");
  if(exact)return exact;

  const nested=Object.keys(files).find(path=>baseName(path).toLowerCase()==="index.html");
  if(nested)return nested;

  return Object.keys(files).find(path=>extension(path)==="html")||
    Object.keys(files)[0]||
    "index.html";
}

function openFile(file){
  file=normalizePath(file);

  if(!(file in files))files[file]="";

  if(currentFile)files[currentFile]=editor.value;

  currentFile=file;

  if(!openFiles.includes(file))openFiles.push(file);

  editor.value=files[file]||"";
  breadcrumb.textContent=file.replace(/\//g," / ");
  projectName.textContent=projectRoot;

  renderExplorer();
  renderTabs();
  renderSyntax();

  editor.focus();
}

function closeTab(file){
  if(openFiles.length===1)return;

  const index=openFiles.indexOf(file);
  openFiles=openFiles.filter(item=>item!==file);

  if(currentFile===file){
    currentFile=openFiles[Math.max(0,index-1)]||openFiles[0];
  }

  openFile(currentFile);
}

function newFile(targetFolder=""){
  const raw=prompt("File name","index.html");
  if(!raw)return;

  let name=normalizePath(raw.trim());
  if(!name)return;

  if(targetFolder&&!name.includes("/")){
    name=normalizePath(targetFolder)+"/"+name;
  }

  if(name in files){
    openFile(name);
    return;
  }

  files[name]="";
  saveStore();
  openFile(name);
}

async function importFiles(list,targetFolder=""){
  let count=0;

  for(const file of [...list]){
    try{
      const relative=file.webkitRelativePath
        ? normalizePath(file.webkitRelativePath)
        : normalizePath(file.name);

      const parts=relative.split("/");
      const withoutRoot=parts.length>1?parts.slice(1).join("/"):parts[0];
      const path=targetFolder
        ? normalizePath(targetFolder)+"/"+withoutRoot
        : withoutRoot;

      if(path){
        files[path]=await file.text();
        addFolderAndParents(parentFolder(path));
        count++;
      }

      if(file.webkitRelativePath){
        projectRoot=parts[0]||projectRoot;
      }
    }catch{}
  }

  if(!count)return;

  saveStore();

  const preferred=firstIndexFile();
  currentFile=preferred;
  openFiles=[preferred];

  renderExplorer();
  renderTabs();
  editor.value=files[preferred]||"";
  breadcrumb.textContent=preferred.replace(/\//g," / ");
  renderSyntax();

  panelBody.innerHTML='<div>$ coding-master import</div><p class="success-row">Imported '+count+" file(s).</p>";
  editor.focus();
}

function findProjectFile(reference){
  const clean=normalizePath(reference).split("?")[0].split("#")[0];

  if(files[clean]!==undefined)return clean;

  const normalized=clean.replace(/^\.\/+/,"");

  const exact=Object.keys(files).find(path=>normalizePath(path)===normalized);
  if(exact)return exact;

  const byBase=Object.keys(files).find(path=>baseName(path)===baseName(normalized));
  return byBase||"";
}

function buildPreviewHtml(){
  files[currentFile]=editor.value;

  const indexFile=firstIndexFile();
  let html=files[indexFile]||"";

  html=html.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi,(full,href)=>{
    const path=findProjectFile(href);

    return path
      ? "<style>\n"+files[path]+"\n</style>"
      : full;
  });

  html=html.replace(/<script([^>]+)src=["']([^"']+\.js)["'][^>]*><\/script>/gi,(full,attrs,src)=>{
    const path=findProjectFile(src);

    if(!path)return full;

    const cleanAttrs=attrs.replace(/\s+src=["'][^"']+["']/i,"");
    return "<script"+cleanAttrs+">"+files[path]+"<\/script>";
  });

  if(!/<meta[^>]+name=["']viewport["']/i.test(html)){
    html=html.replace(/<head>/i,'<head><meta name="viewport" content="width=device-width,initial-scale=1.0">');
  }

  return html;
}

function run(){
  save();

  const html=buildPreviewHtml();
  preview.srcdoc=html;

  panelBody.innerHTML='<div>$ coding-master run</div><p class="success-row">Project is running in the preview.</p>';
}

function openPreview(){
  const html=buildPreviewHtml();
  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const tab=window.open(url,"_blank","noopener,noreferrer");

  if(!tab){
    panelBody.innerHTML='<p class="problem-row">The browser blocked the preview tab. Allow pop-ups for Coding Master.</p>';
  }else{
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
}

document.getElementById("newFileBtn").addEventListener("click",()=>newFile(activeFolder));
document.getElementById("newFolderBtn").addEventListener("click",()=>newFolder(activeFolder));
document.getElementById("openFileBtn").addEventListener("click",()=>filePicker.click());
document.getElementById("openFolderBtn").addEventListener("click",()=>folderPicker.click());

filePicker.addEventListener("change",event=>{
  importFiles(event.target.files);
  event.target.value="";
});

folderPicker.addEventListener("change",event=>{
  importFiles(event.target.files);
  event.target.value="";
});

document.getElementById("runBtn").addEventListener("click",run);
document.getElementById("saveBtn").addEventListener("click",save);
document.getElementById("chromeBtn").addEventListener("click",openPreview);
document.getElementById("refreshBtn").addEventListener("click",run);

document.getElementById("previewToggle").addEventListener("click",()=>{
  const pane=document.getElementById("previewPane");
  pane.style.display=pane.style.display==="none"?"flex":"none";
});

document.getElementById("welcomeBtn").addEventListener("click",()=>{
  localStorage.removeItem("cm-welcome-seen");
  location.href="welcome.html";
});

document.getElementById("commandBtn").addEventListener("click",()=>{
  panelBody.innerHTML="<div>⌘K</div><p>New File • Open File • Open Folder • Save • Run • Preview</p>";
});

document.getElementById("settingsBtn").addEventListener("click",()=>{
  panelBody.innerHTML="<div>⚙ SETTINGS</div><p>Workspace settings are ready.</p>";
});

document.querySelectorAll(".activity[data-view]").forEach(button=>{
  button.addEventListener("click",()=>{
    document.querySelectorAll(".activity[data-view]").forEach(item=>item.classList.remove("active"));
    button.classList.add("active");

    const view=button.dataset.view;
    document.getElementById("sideTitle").textContent=view==="explorer"?"EXPLORER":view.toUpperCase();

    if(view==="explorer"){
      renderExplorer();
      return;
    }

    sideContent.innerHTML='<div class="sidebar-note"><b>'+
      view.toUpperCase()+
      '</b><span>Workspace tools are ready.</span></div>';
  });
});

document.querySelectorAll(".panel-tab").forEach(button=>{
  button.addEventListener("click",()=>{
    document.querySelectorAll(".panel-tab").forEach(item=>item.classList.remove("active"));
    button.classList.add("active");

    if(button.dataset.panel==="problems"){
      const lint=lintCode(editor.value,language(currentFile));

      panelBody.innerHTML=lint.messages.length
        ? lint.messages.map(message=>'<p class="problem-row">• '+escapeHtml(message)+"</p>").join("")
        : '<p class="success-row">No problems found.</p>';

      return;
    }

    panelBody.innerHTML="<div>"+button.dataset.panel.toUpperCase()+"</div><p>Ready.</p>";
  });
});

editor.addEventListener("input",()=>{
  files[currentFile]=editor.value;
  renderSyntax();
});

editor.addEventListener("click",updateStatus);
editor.addEventListener("keyup",updateStatus);
editor.addEventListener("select",updateStatus);

editor.addEventListener("scroll",()=>{
  syntaxLayer.scrollTop=editor.scrollTop;
  syntaxLayer.scrollLeft=editor.scrollLeft;
  lines.scrollTop=editor.scrollTop;
});

editor.addEventListener("keydown",event=>{
  const mod=event.metaKey||event.ctrlKey;

  if(event.key==="Tab"){
    event.preventDefault();

    const start=editor.selectionStart;
    const end=editor.selectionEnd;

    editor.setRangeText("  ",start,end,"end");
    files[currentFile]=editor.value;
    renderSyntax();
    return;
  }

  if(mod&&event.key.toLowerCase()==="s"){
    event.preventDefault();
    save();
  }

  if(mod&&event.key==="Enter"){
    event.preventDefault();
    run();
  }

  if(mod&&event.key.toLowerCase()==="l"){
    event.preventDefault();
    openPreview();
  }

  if(mod&&event.key.toLowerCase()==="o"){
    event.preventDefault();
    filePicker.click();
  }

  if(mod&&event.key.toLowerCase()==="n"){
    event.preventDefault();
    newFile();
  }

  if(mod&&event.key.toLowerCase()==="w"){
    event.preventDefault();
    closeTab(currentFile);
  }
});

document.addEventListener("dragover",event=>{
  event.preventDefault();
});

document.addEventListener("drop",event=>{
  event.preventDefault();

  if(!event.dataTransfer?.files?.length)return;

  const folder=event.target.closest(".tree-folder")?.dataset.folder||"";
  importFiles(event.dataTransfer.files,folder);
});

const requestedNewFile=localStorage.getItem("cm-new-file");

if(requestedNewFile){
  localStorage.removeItem("cm-new-file");
  currentFile=requestedNewFile;
  files[currentFile]="";
  openFiles=[currentFile];
}

if(!(currentFile in files)){
  currentFile=firstIndexFile();
  openFiles=[currentFile];
}

renderExplorer();
renderTabs();
openFile(currentFile);
run();