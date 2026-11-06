// ===== LIFE DASHBOARD: seluruh data disimpan di browser Local Storage =====
const $ = (selector) => document.querySelector(selector);
const STORAGE = {
  tasks: 'lifeDashboardTasks',
  links: 'lifeDashboardLinks',
  name: 'lifeDashboardName',
  theme: 'lifeDashboardTheme'
};

let tasks = JSON.parse(localStorage.getItem(STORAGE.tasks) || '[]');
let links = JSON.parse(localStorage.getItem(STORAGE.links) || '[]');
let userName = localStorage.getItem(STORAGE.name) || '';
let remainingSeconds = 25 * 60;
let timerInterval = null;

function saveTasks() {
  localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 11 ? 'Good morning' : hour < 15 ? 'Good afternoon' : hour < 18 ? 'Good evening' : 'Good night';
  $('#greeting').textContent = `${greeting}${userName ? ', ' + userName : ''}!`;
  $('#clock').textContent = now.toLocaleTimeString('id-ID', { hour12: false });
  $('#date').textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  $('#todayLabel').textContent = now.toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase();
}
updateClock();
setInterval(updateClock, 1000);

// ===== CUSTOM NAME =====
$('#nameButton').addEventListener('click', () => {
  const answer = prompt('Masukkan nama panggilan kamu:', userName);
  if (answer === null) return;
  userName = answer.trim();
  localStorage.setItem(STORAGE.name, userName);
  updateClock();
});

// ===== LIGHT / DARK MODE =====
function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  $('#themeToggle').textContent = theme === 'dark' ? '☀' : '☾';
  localStorage.setItem(STORAGE.theme, theme);
}
applyTheme(localStorage.getItem(STORAGE.theme) || 'light');
$('#themeToggle').addEventListener('click', () => {
  applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
});

// ===== TO-DO LIST =====
function renderTasks() {
  const list = $('#taskList');
  list.innerHTML = '';
  const sortMode = $('#taskSort').value;
  let visibleTasks = [...tasks];
  if (sortMode === 'newest') visibleTasks.sort((a, b) => b.createdAt - a.createdAt);
  if (sortMode === 'oldest') visibleTasks.sort((a, b) => a.createdAt - b.createdAt);
  if (sortMode === 'active') visibleTasks.sort((a, b) => Number(a.done) - Number(b.done));
  if (sortMode === 'done') visibleTasks.sort((a, b) => Number(b.done) - Number(a.done));

  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Tandai tugas selesai');
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const edit = document.createElement('button');
    edit.className = 'small-button';
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => {
      const updated = prompt('Ubah nama tugas:', task.text);
      if (updated === null) return;
      const clean = updated.trim();
      if (!clean) return alert('Tugas tidak boleh kosong.');
      if (tasks.some(t => t.id !== task.id && t.text.toLowerCase() === clean.toLowerCase())) {
        return alert('Tugas tersebut sudah ada.');
      }
      task.text = clean;
      saveTasks();
      renderTasks();
    });

    const remove = document.createElement('button');
    remove.className = 'small-button';
    remove.type = 'button';
    remove.textContent = 'Hapus';
    remove.addEventListener('click', () => {
      if (!confirm(`Hapus tugas "${task.text}"?`)) return;
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(edit, remove);
    item.append(checkbox, text, actions);
    list.append(item);
  });

  const completed = tasks.filter(task => task.done).length;
  $('#taskCount').textContent = `${completed}/${tasks.length} selesai`;
  $('#emptyState').hidden = tasks.length > 0;
}

$('#taskForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#taskInput');
  const text = input.value.trim();
  $('#taskMessage').textContent = '';
  if (!text) return;
  // Challenge: cegah tugas dengan nama yang sama (tanpa membedakan huruf besar/kecil).
  if (tasks.some(task => task.text.toLowerCase() === text.toLowerCase())) {
    $('#taskMessage').textContent = 'Tugas ini sudah ada di daftar.';
    return;
  }
  tasks.push({ id: Date.now(), text, done: false, createdAt: Date.now() });
  saveTasks();
  input.value = '';
  renderTasks();
});
$('#taskSort').addEventListener('change', renderTasks);
renderTasks();

// ===== FOCUS TIMER: 25 MENIT =====
function showTimer() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  $('#timerDisplay').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
$('#startTimer').addEventListener('click', () => {
  if (timerInterval !== null) return;
  if (remainingSeconds === 0) remainingSeconds = 25 * 60;
  $('#timerStatus').textContent = 'Sedang fokus. Semangat!';
  timerInterval = setInterval(() => {
    remainingSeconds--;
    showTimer();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      $('#timerStatus').textContent = 'Waktu selesai! Saatnya istirahat.';
      alert('Sesi fokus 25 menit selesai. Good job!');
    }
  }, 1000);
});
$('#stopTimer').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  $('#timerStatus').textContent = 'Timer dijeda.';
});
$('#resetTimer').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  remainingSeconds = 25 * 60;
  showTimer();
  $('#timerStatus').textContent = 'Timer diatur ulang.';
});
showTimer();

// ===== QUICK LINKS =====
function saveLinks() {
  localStorage.setItem(STORAGE.links, JSON.stringify(links));
}
function renderLinks() {
  const container = $('#quickLinks');
  container.innerHTML = '';
  links.forEach((link, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'quick-link';
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.name;
    anchor.style.cssText = 'color:inherit;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1';
    const remove = document.createElement('button');
    remove.className = 'remove-link';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Hapus ${link.name}`);
    remove.addEventListener('click', () => {
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });
    wrapper.append(anchor, remove);
    container.append(wrapper);
  });
}
$('#linkForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#linkName').value.trim();
  let url = $('#linkUrl').value.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('URL tidak valid');
    if (links.some(link => link.url === parsed.href)) return alert('Link tersebut sudah tersimpan.');
    links.push({ name, url: parsed.href });
    saveLinks();
    renderLinks();
    $('#linkForm').reset();
  } catch {
    alert('Masukkan alamat website yang valid.');
  }
});
renderLinks();
