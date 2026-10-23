'use strict';

// Pure staging contract for the future multi-row reconciliation editor.
// No storage writes, no balance mutation and no invented accounting formula.
// Uses the active financial model's saveTransaction/checkRows/checkedBalance.
function buildReconciliationBatch(state, checkId, rows, engine, today, previewOnly) {
  if (!state || !engine || typeof engine.saveTransaction !== 'function' ||
      typeof engine.checkRows !== 'function' || typeof engine.checkedBalance !== 'function') {
    throw new Error('Motorul financiar nu este disponibil.');
  }
  if (!Array.isArray(rows) || (!previewOnly && rows.length === 0) || rows.length > 100) {
    throw new Error('Adaugă între 1 și 100 de operațiuni.');
  }
  const check = (state.balanceChecks || []).find(c => c.id === checkId && !c.voided);
  if (!check) throw new Error('Verificarea de sold nu mai există.');
  const account = (state.accounts || []).find(a => a.id === check.accountId);
  if (!account || !['current', 'savings', 'cash'].includes(account.kind)) {
    throw new Error('Acest contract acceptă doar conturi de bani, nu datorii.');
  }
  const original = engine.checkRows(state, check.accountId).find(c => c.id === checkId);
  if (!original || !Number.isSafeInteger(original.difference) || original.difference === 0) {
    throw new Error('Nu există o diferență de explicat.');
  }
  const originalBalance = engine.checkedBalance(state, check.accountId, check.date);
  const existingIds = new Set([
    ...(state.accounts || []), ...(state.debts || []),
    ...(state.transactions || []), ...(state.balanceChecks || []),
    ...(state.incomes || []), ...(state.expenses || []),
    ...(state.recurring || []), ...(state.goals || []), ...(state.plans || [])
  ].map(item => item.id));
  const draft = JSON.parse(JSON.stringify(state)); // Never expose partial edits to the live ledger.
  let staged = draft;
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || !row.id.trim() || existingIds.has(row.id)) {
      throw new Error('Identificator de operațiune invalid sau duplicat.');
    }
    existingIds.add(row.id);
    if (!['income', 'expense'].includes(row.kind) || !Number.isSafeInteger(row.amount) ||
        row.amount <= 0 || row.amount > 1e12) {
      throw new Error('Suma sau tipul operațiunii nu este valid.');
    }
    if (row.date !== check.date || row.accountId !== check.accountId ||
        row.reconciliationCheckId !== checkId || row.creditId || row.debtId ||
        row.destinationId || row.destinationCreditId || row.refinancingDebtId) {
      throw new Error('Operațiunea trebuie să aparțină verificării și datei sale.');
    }
    if (row.order !== undefined) {
      throw new Error('Ordinea operațiunilor este atribuită de motorul financiar.');
    }
    staged = engine.saveTransaction(staged, { ...row }, today);
  }
  const after = engine.checkRows(staged, check.accountId).find(c => c.id === checkId);
  if (!after || !Number.isSafeInteger(after.difference) || (!previewOnly && after.difference !== 0)) {
    throw new Error('Explicațiile nu acoperă diferența; salvează numai un lot complet.');
  }
  if (after.observed !== original.observed ||
      engine.checkedBalance(staged, check.accountId, check.date) !== originalBalance ||
      JSON.stringify(staged.balanceChecks) !== JSON.stringify(state.balanceChecks)) {
    throw new Error('Verificarea sau soldul confirmat s-a modificat neașteptat.');
  }
  if (previewOnly) {
    const explainedDifference = original.difference - after.difference;
    if (!Number.isSafeInteger(explainedDifference)) throw new Error('Totalul explicațiilor depășește limita sigură.');
    return Object.freeze({
      differenceBeforeDraft: original.difference,
      explainedDifference,
      remainingDifference: after.difference,
      canSave: rows.length > 0 && after.difference === 0
    });
  }
  return staged; // Caller must persist this snapshot ONCE, only after success.
}

function stageReconciliationBatch(state, checkId, rows, engine, today) {
  return buildReconciliationBatch(state, checkId, rows, engine, today, false);
}

// Financial-engine-derived live totals; never returns a persistable partial snapshot.
function previewReconciliationBatch(state, checkId, rows, engine, today) {
  return buildReconciliationBatch(state, checkId, rows, engine, today, true);
}

module.exports = { stageReconciliationBatch, previewReconciliationBatch };
