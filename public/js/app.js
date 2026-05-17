'use strict';

// ── State ──────────────────────────────────────────────────────────────────────
let activeDay = -1;
let activeTab = 'schedule';
let saveTimer = null;
let socket;   // assigned in init section

// ── API helpers ────────────────────────────────────────────────────────────────
function getSid() {
  return (socket && socket.connected) ? socket.id : null;
}

async function apiFetch(url, opts = {}) {
  const { body, ...rest } = opts;
  const config = { ...rest };
  if (body !== undefined) {
    const sid = getSid();
    config.headers = { 'Content-Type': 'application/json' };
    // _sid lets the server skip broadcasting back to the sender (no double-render)
    config.body = JSON.stringify(sid ? { ...body, _sid: sid } : body);
  }
  const res = await fetch(url, config);
  if (res.status === 204) return null;
  return res.json();
}

async function getTodos(dayIndex) {
  let todos = await apiFetch(`/api/todos/${dayIndex}`);
  if (todos.length === 0) {
    todos = await apiFetch(`/api/todos/${dayIndex}/seed`, {
      method: 'POST',
      body: { texts: DAYS[dayIndex].defaultTodos },
    });
  }
  return todos;
}

async function createTodo(dayIndex, text) {
  return apiFetch(`/api/todos/${dayIndex}`, { method: 'POST', body: { text } });
}

async function toggleTodo(id, done) {
  return apiFetch(`/api/todos/${id}`, { method: 'PATCH', body: { done } });
}

async function deleteTodo(id) {
  // DELETE has no body — pass _sid as a query param instead
  const sid = getSid();
  const url  = `/api/todos/${id}${sid ? `?_sid=${encodeURIComponent(sid)}` : ''}`;
  return apiFetch(url, { method: 'DELETE' });
}

async function getNote(dayIndex) {
  return apiFetch(`/api/notes/${dayIndex}`); // → { body }
}

async function saveNote(dayIndex, body) {
  return apiFetch(`/api/notes/${dayIndex}`, { method: 'PUT', body: { body } });
}

// ── Tab switching (mobile) ─────────────────────────────────────────────────────
function selectTab(name) {
  activeTab = name;
  document.querySelectorAll('.dp-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.dp-panel').forEach(p =>
    p.classList.toggle('active', p.id === `dp-panel-${name}`));
}

// ── Progress ring ──────────────────────────────────────────────────────────────
function renderRing(btn, done, total) {
  const r   = 5;
  const c   = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const fill = btn.querySelector('.pring-fill');
  fill.style.strokeDasharray  = c;
  fill.style.strokeDashoffset = c * (1 - pct);
}

// ── Build day buttons ──────────────────────────────────────────────────────────
async function buildDayButtons() {
  const row = document.getElementById('days-row');
  DAYS.forEach((d, i) => {
    const btn = document.createElement('button');
    btn.className   = 'day-btn';
    btn.dataset.idx = i;
    const r = 5, c = 2 * Math.PI * r;
    btn.innerHTML = `
      <div class="progress-ring">
        <svg class="pring-svg" viewBox="0 0 14 14" aria-hidden="true">
          <circle class="pring-bg"   cx="7" cy="7" r="${r}"/>
          <circle class="pring-fill" cx="7" cy="7" r="${r}"
            stroke-dasharray="${c}" stroke-dashoffset="${c}"/>
        </svg>
      </div>
      <div class="db-date">${d.date}</div>
      <i class="ti ${d.icon} db-icon" aria-hidden="true"></i>
      <div class="db-city">${d.city}</div>`;
    btn.onclick = () => selectDay(i);
    row.appendChild(btn);
  });

  try {
    const progress = await apiFetch('/api/progress');
    const map = {};
    progress.forEach(p => { map[p.day_index] = p; });
    document.querySelectorAll('.day-btn').forEach((btn, i) => {
      const p = map[i];
      if (p) renderRing(btn, p.done, p.total);
    });
  } catch (_) { /* rings stay empty on error */ }
}

// ── Select / deselect a day ────────────────────────────────────────────────────
async function selectDay(i) {
  const btns = document.querySelectorAll('.day-btn');
  if (activeDay === i) {
    btns[i].classList.remove('active');
    document.getElementById('detail-panel').classList.remove('open');
    activeDay = -1;
    return;
  }
  if (activeDay >= 0) btns[activeDay].classList.remove('active');
  activeDay = i;
  btns[i].classList.add('active');
  document.getElementById('detail-panel').classList.add('open');
  document.getElementById('no-sel').style.display     = 'none';
  document.getElementById('dp-content').style.display = 'block';
  await renderDetail(i);
  document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Render full detail for a day ───────────────────────────────────────────────
async function renderDetail(i) {
  const d = DAYS[i];
  document.getElementById('dp-icon').innerHTML       = `<i class="ti ${d.icon}" aria-hidden="true"></i>`;
  document.getElementById('dp-title').textContent    = d.city;
  document.getElementById('dp-subtitle').textContent = `${d.date} · ${d.subtitle}`;

  document.getElementById('dp-events').innerHTML = d.events.map(ev => `
    <div class="ev">
      <div class="ev-time">${ev.time}</div>
      <div class="ev-card ${ev.type}">
        <div class="ev-title">
          <i class="ti ${ev.icon}" aria-hidden="true"
             style="font-size:11px;margin-right:4px;vertical-align:-1px;"></i>${ev.title}
        </div>
        ${ev.note ? `<div class="ev-note">${ev.note}</div>` : ''}
      </div>
    </div>`).join('');

  document.getElementById('dp-packing').innerHTML = d.packing.map(p => `
    <span class="pack-tag">
      <i class="ti ti-check" aria-hidden="true" style="font-size:9px;"></i>${p}
    </span>`).join('');

  const [noteData] = await Promise.all([getNote(i), renderTodos(i)]);

  const noteArea = document.getElementById('notes-area');
  noteArea.value = noteData.body || '';
  noteArea.oninput = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await saveNote(i, noteArea.value);
      showSaveIndicator();
    }, 600);
  };

  document.getElementById('todo-input').onkeydown = e => { if (e.key === 'Enter') addTodo(); };

  selectTab(activeTab);
}

// ── Render todo list ───────────────────────────────────────────────────────────
async function renderTodos(i) {
  const todos = await getTodos(i);
  const done  = todos.filter(t => t.done).length;

  document.getElementById('dp-progress-num').textContent = `${done}/${todos.length}`;
  renderRing(document.querySelectorAll('.day-btn')[i], done, todos.length);

  const list = document.getElementById('dp-todos');
  list.innerHTML = '';
  todos.forEach(t => {
    const div = document.createElement('div');
    div.className = 'todo-item';
    const uid = `tc_${t.id}`;
    div.innerHTML = `
      <input type="checkbox" class="todo-check" id="${uid}" ${t.done ? 'checked' : ''}/>
      <label for="${uid}" class="todo-label${t.done ? ' done' : ''}">${escHtml(t.text)}</label>
      <button class="todo-del" title="Remove">
        <i class="ti ti-x" aria-hidden="true" style="font-size:10px;"></i>
      </button>`;

    div.querySelector('.todo-check').onchange = async function () {
      await toggleTodo(t.id, this.checked);
      await renderTodos(i);
    };
    div.querySelector('.todo-del').onclick = async () => {
      await deleteTodo(t.id);
      await renderTodos(i);
    };
    list.appendChild(div);
  });
}

// ── Add a todo ─────────────────────────────────────────────────────────────────
async function addTodo() {
  if (activeDay < 0) return;
  const input = document.getElementById('todo-input');
  const text  = input.value.trim();
  if (!text) return;
  await createTodo(activeDay, text);
  input.value = '';
  await renderTodos(activeDay);
}

// ── Save indicator ─────────────────────────────────────────────────────────────
function showSaveIndicator(msg = 'Saved', duration = 2500) {
  const ind = document.getElementById('save-indicator');
  ind.innerHTML = `<i class="ti ti-check" style="font-size:9px;"></i> ${escHtml(msg)}`;
  ind.classList.add('show');
  clearTimeout(ind._hideTimer);
  ind._hideTimer = setTimeout(() => ind.classList.remove('show'), duration);
}

// ── Countdown ──────────────────────────────────────────────────────────────────
function setCountdown() {
  const depart  = new Date('2025-05-30T10:20:00');
  const tripEnd = new Date('2025-06-07T23:59:00');
  const now     = new Date();
  const el      = document.getElementById('countdown-text');
  const diff    = depart - now;

  if (diff > 0) {
    const days = Math.floor(diff / 864e5);
    const hrs  = Math.floor((diff % 864e5) / 36e5);
    const mins = Math.floor((diff % 36e5)  / 6e4);
    el.innerHTML = `<span class="countdown-num">${days}</span> days
      <span class="countdown-num">${hrs}</span> hrs
      <span class="countdown-num">${mins}</span> min until departure &nbsp;✦&nbsp; Start planning!`;
  } else if (now <= tripEnd) {
    const dayNum = Math.floor((now - depart) / 864e5) + 1;
    const port   = DAYS[Math.min(dayNum - 1, 8)];
    el.innerHTML = `<span class="countdown-num">Day ${dayNum} of 9</span>
      &nbsp;—&nbsp; You're in <span class="countdown-num">${port.city}</span>! Enjoy every moment.`;
  } else {
    el.innerHTML = `What an adventure! The Alaska cruise is a wonderful memory. 🚢`;
  }
}

// ── Utility ────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Socket.io ──────────────────────────────────────────────────────────────────
socket = io();

socket.on('todo:add', ({ todo, progress }) => {
  const btn = document.querySelectorAll('.day-btn')[todo.day_index];
  if (btn) renderRing(btn, progress.done, progress.total);
  if (activeDay === todo.day_index) renderTodos(todo.day_index);
});

socket.on('todo:toggle', ({ day_index, progress }) => {
  const btn = document.querySelectorAll('.day-btn')[day_index];
  if (btn) renderRing(btn, progress.done, progress.total);
  if (activeDay === day_index) renderTodos(day_index);
});

socket.on('todo:delete', ({ day_index, progress }) => {
  const btn = document.querySelectorAll('.day-btn')[day_index];
  if (btn) renderRing(btn, progress.done, progress.total);
  if (activeDay === day_index) renderTodos(day_index);
});

socket.on('note:save', ({ day_index, body }) => {
  if (activeDay !== day_index) return;
  const noteArea = document.getElementById('notes-area');
  if (document.activeElement === noteArea) return; // don't clobber local typing
  noteArea.value = body;
  showSaveIndicator('Notes updated');
});

// ── Init ───────────────────────────────────────────────────────────────────────
buildDayButtons();
setCountdown();
setInterval(setCountdown, 60000);
