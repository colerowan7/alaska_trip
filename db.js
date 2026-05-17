'use strict';
const fs   = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const FILE     = path.join(DATA_DIR, 'alaska-data.json');

function empty() {
  return { _nextId: 1, todos: {}, notes: {}, seeded: [] };
}

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch (_) { return empty(); }
}

function save(state) {
  // Synchronous write keeps reads and writes serialised on the event loop
  fs.writeFileSync(FILE, JSON.stringify(state), 'utf8');
}

// Load state → call fn(state) → save → return fn's return value
function tx(fn) {
  const state  = load();
  const result = fn(state);
  save(state);
  return result;
}

module.exports = { load, tx };
