/* Coding Master — desktop native tools bridge */
(function(){
  "use strict";

  const T = window.__TAURI__;
  const native = Boolean(T?.dialog && T?.fs && T?.shell);

  const TEXT_EXTENSIONS = new Set([
    "html","htm","css","js","jsx","ts","tsx","json","md","txt","xml","svg",
    "yml","yaml","toml","ini","env","sql","py","rs","java","c","cpp","h","hpp",
    "php","go","swift","kt","kts","vue","svelte"
  ]);

  const SKIP_DIRS = new Set([
    ".git","node_modules",".next","dist","build","target",".venv","venv","__pycache__"
  ]);

  function normalize(value){
    return String(value || "").replace(/\\/g,"/");
  }

  function ext(path){
    const name=normalize(path).split("/").pop() || "";
    const i=name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i+1).toLowerCase();
  }

  function isText(path){
    const e=ext(path);
    return TEXT_EXTENSIONS.has(e);
  }

  async function join(...parts){
    if(T?.path?.join) return T.path.join(...parts);
    return parts.map(normalize).filter(Boolean).join("/");
  }

  function relativePath(root, file){
    const r=normalize(root).replace(/\\+$/,"");
    const f=normalize(file);
    const rl=r.toLowerCase();
    const fl=f.toLowerCase();

    if(fl.startsWith(rl + "/")){
      return f.slice(r.length+1);
    }

    return f.split("/").pop() || f;
  }

  async function readFolder(rootPath){
    const files={};
    const nativePaths={};
    const folders=new Set();
    const queue=[rootPath];
    let count=0;

    while(queue.length && count < 2000){
      const current=queue.shift();

      let entries=[];
      try{
        entries=await T.fs.readDir(current);
      }catch{
        continue;
      }

      for(const entry of entries){
        if(!entry?.name) continue;

        const fullPath=await join(current,entry.name);

        if(entry.isDirectory){
          if(SKIP_DIRS.has(entry.name)) continue;
          folders.add(relativePath(rootPath,fullPath));
          queue.push(fullPath);
          continue;
        }

        if(!isText(entry.name)) continue;

        try{
          files[relativePath(rootPath,fullPath)] = await T.fs.readTextFile(fullPath);
          nativePaths[relativePath(rootPath,fullPath)] = fullPath;
          count++;
        }catch{}
      }
    }

    return {
      rootPath,
      rootName:normalize(rootPath).split("/").pop() || "CODING-MASTER",
      files,
      nativePaths,
      folders:[...folders]
    };
  }

  async function openFile(){
    if(!native) return null;

    const selected=await T.dialog.open({
      directory:false,
      multiple:false,
      title:"Open File",
      filters:[{
        name:"Code",
        extensions:[...TEXT_EXTENSIONS]
      }]
    });

    if(!selected || Array.isArray(selected)) return null;

    try{
      return {
        path:selected,
        name:normalize(selected).split("/").pop() || "untitled",
        content:await T.fs.readTextFile(selected)
      };
    }catch(error){
      throw new Error("Unable to read the selected file.");
    }
  }

  async function openFolder(){
    if(!native) return null;

    const selected=await T.dialog.open({
      directory:true,
      multiple:false,
      recursive:true,
      title:"Open Folder"
    });

    if(!selected || Array.isArray(selected)) return null;
    return readFolder(selected);
  }

  async function writeText(path,content){
    if(!native) return false;
    await T.fs.writeTextFile(path,content);
    return true;
  }

  async function makeDirectory(path){
    if(!native) return false;
    await T.fs.mkdir(path,{recursive:true});
    return true;
  }

  async function runCommand(command,cwd){
    if(!native) throw new Error("The Terminal is available in the Coding Master desktop app.");

    const isWindows=/Windows/i.test(navigator.userAgent);
    const Command=T.shell.Command;

    if(!Command) throw new Error("Terminal support is not available in this build.");

    const process=isWindows
      ? Command.create("cm-powershell",["-NoProfile","-Command",command],cwd?{cwd}:undefined)
      : Command.create("cm-shell",["-lc",command],cwd?{cwd}:undefined);

    return process.execute();
  }

  window.CMDesktop={
    isTauri:()=>native,
    openFile,
    openFolder,
    readFolder,
    writeText,
    makeDirectory,
    runCommand,
    join,
    normalize,
    relativePath
  };
})();