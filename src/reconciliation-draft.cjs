'use strict';

// UI-independent, fail-closed draft controller. No vault, storage or live-state writes.
// Final financial arithmetic is delegated to the active model by reconciliation-batch.
const { stageReconciliationBatch, previewReconciliationBatch } = require('./reconciliation-batch.cjs');

function createReconciliationDraft({ state, checkId, engine, today }) {
  if (!state || typeof state !== 'object' || typeof checkId !== 'string' || !checkId) {
    throw new Error('Verificarea de sold sau registrul lipsește.');
  }
  const baseline = JSON.stringify(state);
  if (!baseline) throw new Error('Registrul nu poate fi copiat.');
  const original = JSON.parse(baseline);
  let rows = [];
  let status = 'open';
  // Validate the check/account at session creation, not only at final save.
  previewReconciliationBatch(original, checkId, rows, engine, today);

  function assertOpen() {
    if (status !== 'open') throw new Error('Această reconciliere a fost închisă.');
  }
  function copy(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Operațiunea trebuie să fie un obiect.');
    }
    const serialized = JSON.stringify(value);
    if (!serialized) throw new Error('Operațiunea nu poate fi copiată.');
    return JSON.parse(serialized);
  }
  function change(next) {
    // Preview validates the ENTIRE candidate before any edit becomes visible.
    const summary = previewReconciliationBatch(original, checkId, next, engine, today);
    rows = next;
    return summary;
  }
  function add(row) {
    assertOpen();
    return change([...rows, copy(row)]);
  }
  function update(id, changes) {
    assertOpen();
    const at = rows.findIndex(row => row.id === id);
    if (at < 0) throw new Error('Operațiunea nu mai există în ciornă.');
    const patch = copy(changes);
    if (Object.prototype.hasOwnProperty.call(patch, 'id')) {
      throw new Error('Identificatorul operațiunii nu poate fi schimbat.');
    }
    const next = rows.slice();
    next[at] = { ...next[at], ...patch };
    return change(next);
  }
  function remove(id) {
    assertOpen();
    if (!rows.some(row => row.id === id)) throw new Error('Operațiunea nu mai există în ciornă.');
    return change(rows.filter(row => row.id !== id));
  }
  function preview() {
    assertOpen();
    return previewReconciliationBatch(original, checkId, rows, engine, today);
  }
  function getRows() {
    assertOpen();
    return JSON.parse(JSON.stringify(rows)); // Caller cannot mutate the internal draft.
  }
  function prepare(currentState) {
    assertOpen();
    // Fail closed even if an unrelated operation changed the ledger while editing.
    // The UI must supply the CURRENT state immediately before its guarded save.
    if (JSON.stringify(currentState) !== baseline) {
      throw new Error('Registrul s-a modificat. Reîncarcă reconcilierea înainte de salvare.');
    }
    const snapshot = stageReconciliationBatch(original, checkId, rows, engine, today);
    status = 'prepared'; // One handoff only: prevents duplicate submissions.
    rows = [];
    return snapshot;
  }
  function cancel() {
    assertOpen();
    status = 'cancelled';
    rows = [];
  }
  return Object.freeze({ add, update, remove, preview, getRows, prepare, cancel });
}

module.exports = { createReconciliationDraft };
