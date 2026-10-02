document.addEventListener('DOMContentLoaded', () => {

  const welcomeScreen = document.getElementById('welcome-screen');
  const editorContainer = document.getElementById('editor-container');
  const codeEditor = document.getElementById('code-editor');
  const tabsContainer = document.getElementById('tabs-container');
  const addTabBtn = document.getElementById('add-tab-btn');
  const welcomeTab = document.getElementById('welcome-tab');

  // 1. زر New File
  document.getElementById('btn-new-file').addEventListener('click', () => {
    createNewFile('Untitled.txt', '');
  });

  // 2. زر Open File
  document.getElementById('btn-open-file').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = "*/*";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        const fileContent = event.target.result;
        createNewFile(file.name, fileContent);
        showNotification(`تم فتح ملف: ${file.name}`);
      };
      reader.readAsText(file);
    };
    input.click();
  });

  // 3. زر Open Folder
  document.getElementById('btn-open-folder').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.onchange = () => showNotification('تم تحديد المجلد بنجاح');
    input.click();
  });

  // دالة إنشاء ملف جديد
  function createNewFile(fileName, content) {
    welcomeScreen.style.display = 'none';
    editorContainer.style.display = 'flex';
    codeEditor.value = content;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    const newTab = document.createElement('div');
    newTab.className = 'tab active';
    newTab.innerHTML = `
            <i class="fas fa-file-code"></i>
            <span>${fileName}</span>
            <i class="fas fa-times close-tab"></i>
        `;

    newTab.querySelector('.close-tab').addEventListener('click', (e) => {
      e.stopPropagation();
      newTab.remove();

      if (document.querySelectorAll('.tab').length === 1) {
        editorContainer.style.display = 'none';
        welcomeScreen.style.display = 'flex';
        welcomeTab.classList.add('active');
      }
    });

    tabsContainer.insertBefore(newTab, addTabBtn);
  }

  // زر التبويب الافتراضي Welcome
  welcomeTab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    welcomeTab.classList.add('active');
    editorContainer.style.display = 'none';
    welcomeScreen.style.display = 'flex';
  });

  // إضافة تبويب من علامة (+)
  addTabBtn.addEventListener('click', () => createNewFile('Untitled.txt', ''));

  // طي/إظهار الـ Terminal
  const terminalHeader = document.querySelector('.terminal-header');
  const terminalContent = document.querySelector('.terminal-content');
  const terminalChevron = document.querySelector('.terminal-header .fa-chevron-up');

  terminalHeader.addEventListener('click', () => {
    const isHidden = terminalContent.style.display === 'none';
    terminalContent.style.display = isHidden ? 'block' : 'none';
    terminalChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
  });

  // نظام الإشعارات
  function showNotification(message) {
    let toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#3b82f6', color: '#fff', padding: '10px 20px',
      borderRadius: '6px', fontSize: '13px', zIndex: '1000',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'opacity 0.3s'
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
  }

  // --- برمجة زر وقائمة الحساب (الصورة الدائرية) ---
  const githubBtn = document.getElementById('github-login-btn');
  const githubMenu = document.getElementById('github-menu');
  const signInLink = document.getElementById('sign-in-link');

  // إظهار/إخفاء القائمة عند النقر على الصورة
  githubBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    githubMenu.classList.toggle('show');
  });

  // إغلاق القائمة عند النقر في مكان آخر في الصفحة
  document.addEventListener('click', (e) => {
    if (!githubBtn.contains(e.target) && !githubMenu.contains(e.target)) {
      githubMenu.classList.remove('show');
    }
  });

  // التوجيه عند النقر على تسجيل الدخول
  signInLink.addEventListener('click', () => {
    githubMenu.classList.remove('show');
    showNotification('جاري توجيهك إلى صفحة تسجيل الدخول في GitHub...');
  });
});