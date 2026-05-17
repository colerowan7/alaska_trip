'use strict';
const http       = require('http');
const express    = require('express');
const path       = require('path');
const { Server } = require('socket.io');
const { load, tx } = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseDay(param) {
  const n = parseInt(param, 10);
  return (isNaN(n) || n < 0 || n > 8) ? null : n;
}

const now = () => new Date().toISOString();

function getDayProgress(state, day) {
  const list = state.todos[day] || [];
  return { total: list.length, done: list.filter(t => t.done).length };
}

// Read note regardless of whether it's stored as a string (legacy) or object (current)
function readNote(state, day) {
  const n = state.notes[day];
  if (!n)                    return { body: '' };
  if (typeof n === 'string') return { body: n };
  return { body: n.body || '' };
}

// Emit to all sockets EXCEPT the sender (if sid known), else to everyone
function broadcast(sid, event, data) {
  (sid ? io.except(sid) : io).emit(event, data);
}

// ── Socket.io ──────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log(`  [ws] + ${socket.id}`);
  socket.on('disconnect', () => console.log(`  [ws] - ${socket.id}`));
});

// ── Todos ──────────────────────────────────────────────────────────────────────

// GET /api/todos/:day
app.get('/api/todos/:day', (req, res) => {
  const day = parseDay(req.params.day);
  if (day === null) return res.status(400).json({ error: 'day must be 0–8' });
  res.json(load().todos[day] || []);
});

// POST /api/todos/:day/seed — insert defaults exactly once per day
app.post('/api/todos/:day/seed', (req, res) => {
  const day   = parseDay(req.params.day);
  const texts = req.body.texts;
  if (day === null)          return res.status(400).json({ error: 'day must be 0–8' });
  if (!Array.isArray(texts)) return res.status(400).json({ error: 'texts must be an array' });

  const todos = tx(state => {
    if (state.seeded.includes(day)) return state.todos[day] || [];
    const ts = now();
    state.todos[day] = texts
      .map(t => String(t).trim()).filter(Boolean)
      .map(text => ({ id: state._nextId++, day_index: day, text, done: false, created_at: ts, updated_at: ts }));
    state.seeded.push(day);
    return state.todos[day];
  });
  res.json(todos);
});

// POST /api/todos/:day — add a new todo
app.post('/api/todos/:day', (req, res) => {
  const day  = parseDay(req.params.day);
  const text = String(req.body.text || '').trim();
  const sid  = req.body._sid || null;
  if (day === null) return res.status(400).json({ error: 'day must be 0–8' });
  if (!text)        return res.status(400).json({ error: 'text is required' });

  const { todo, progress } = tx(state => {
    const t = { id: state._nextId++, day_index: day, text, done: false, created_at: now(), updated_at: now() };
    if (!state.todos[day]) state.todos[day] = [];
    state.todos[day].push(t);
    return { todo: t, progress: getDayProgress(state, day) };
  });
  broadcast(sid, 'todo:add', { todo, progress });
  res.status(201).json(todo);
});

// PATCH /api/todos/:id — toggle done
app.patch('/api/todos/:id', (req, res) => {
  const id   = parseInt(req.params.id, 10);
  const done = !!req.body.done;
  const sid  = req.body._sid || null;
  if (isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const result = tx(state => {
    for (const [day, list] of Object.entries(state.todos)) {
      const t = list.find(t => t.id === id);
      if (t) {
        t.done = done; t.updated_at = now();
        const day_index = parseInt(day, 10);
        return { todo: t, day_index, progress: getDayProgress(state, day_index) };
      }
    }
    return null;
  });
  if (!result) return res.status(404).json({ error: 'todo not found' });
  broadcast(sid, 'todo:toggle', { id, day_index: result.day_index, done, progress: result.progress });
  res.json(result.todo);
});

// DELETE /api/todos/:id  (_sid passed as query param since DELETE has no body)
app.delete('/api/todos/:id', (req, res) => {
  const id  = parseInt(req.params.id, 10);
  const sid = req.query._sid || null;
  if (isNaN(id)) return res.status(400).json({ error: 'invalid id' });

  const result = tx(state => {
    for (const [day, list] of Object.entries(state.todos)) {
      const idx = list.findIndex(t => t.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        const day_index = parseInt(day, 10);
        return { day_index, progress: getDayProgress(state, day_index) };
      }
    }
    return null;
  });
  if (result) broadcast(sid, 'todo:delete', { id, day_index: result.day_index, progress: result.progress });
  res.status(204).end();
});

// ── Notes ──────────────────────────────────────────────────────────────────────

// GET /api/notes/:day
app.get('/api/notes/:day', (req, res) => {
  const day = parseDay(req.params.day);
  if (day === null) return res.status(400).json({ error: 'day must be 0–8' });
  res.json(readNote(load(), day));
});

// PUT /api/notes/:day — upsert note
app.put('/api/notes/:day', (req, res) => {
  const day  = parseDay(req.params.day);
  const body = String(req.body.body || '');
  const sid  = req.body._sid || null;
  if (day === null) return res.status(400).json({ error: 'day must be 0–8' });

  tx(state => { state.notes[day] = { body, updated_at: now() }; });
  broadcast(sid, 'note:save', { day_index: day, body });
  res.json({ ok: true });
});

// ── Progress ───────────────────────────────────────────────────────────────────

// GET /api/progress — aggregate counts for all days (drives progress rings on load)
app.get('/api/progress', (req, res) => {
  const { todos } = load();
  res.json(Object.entries(todos).map(([day, list]) => ({
    day_index: parseInt(day, 10),
    total: list.length,
    done:  list.filter(t => t.done).length,
  })));
});

// ── SPA / trip URL ─────────────────────────────────────────────────────────────
// /trip/:token serves the same app — the token is the shareable path
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`\n  Alaska Planner  →  http://localhost:${PORT}`);
  console.log(`  Share link     →  http://localhost:${PORT}/trip/alaska-2025\n`);
});
