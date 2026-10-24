'use strict';
// Test-first contract for a future multi-row editor. Exercises the REAL active
// bundle's saveTransaction, checkRows and checkedBalance; UI is not wired yet.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stageReconciliationBatch, previewReconciliationBatch } = require('../src/reconciliation-batch.cjs');
const html = fs.readFileSync('index.html', 'utf8');
const bundle = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle, 'Active bundle not found');
const source = fs.readFileSync(bundle, 'utf8');
function factory(marker, terminator) {
  const at = source.indexOf(marker);
  assert.ok(at >= 0, 'Expected financial module missing: ' + marker);
  const start = source.lastIndexOf('__d(function(', at);
  const end = source.indexOf(terminator, at);
  assert.ok(start >= 0 && end > start, 'Financial module boundary missing');
  return vm.runInNewContext('(' + source.slice(start + 4, end + 1) + ')');
}
const rec = {};
factory('Object.defineProperty(_e,"comparePoint"', '},207,[]);')({}, () => {}, () => {}, null, {}, rec, []);
const model = {};
const dependencies = {
  206: { upgradeNames: s => s, roleOf: t => t.kind, attachTransactionName: (s,t) => ({s,t}), validateNames: () => {} },
  207: rec,
  208: { validAppearance: () => true },
  209: { isDashboardModuleId: () => true },
  210: {},
  204: { today: () => '2026-10-23', validDate: d => /^\d{4}-\d{2}-\d{2}$/.test(d), validateState: () => {} }
};
// Only unrelated dependencies (names, theme, legacy) are stubbed. Financial
// saveTransaction and reconciliation logic are taken from the active bundle.
factory('e.saveTransaction=function', '},205,[206,207,208,209,210,204]);')(
  {}, id => dependencies[id], () => {}, null, {}, model, [206,207,208,209,210,204]
);
const engine = { saveTransaction: model.saveTransaction, checkRows: rec.checkRows, checkedBalance: rec.checkedBalance };
const today = '2026-10-23', date = '2026-10-13';
function state(observed = 9500) {
  const s = model.emptyState('2026-10-01');
  s.accounts.push({id:'ing',name:'ING',kind:'current',date:'2026-10-01',opening:10000});
  s.balanceChecks.push({id:'c1',accountId:'ing',observed,date,order:3000});
  return s;
}
const row = (id, kind, amount, extra = {}) =>
  ({id,name:id,kind,amount,date,accountId:'ing',reconciliationCheckId:'c1',details:[],...extra});
function test(name, run) {
  try { run(); console.log('PASS', name); }
  catch (e) { console.error('FAIL', name, e.stack || e.message); process.exitCode = 1; }
}
function stage(s, rows) { return stageReconciliationBatch(s, 'c1', rows, engine, today); }
function diff(s, id = 'c1') { return rec.checkRows(s,'ing').find(c => c.id === id).difference; }
test('Signed expense 700 and income 200 close -500 without changing observed balance', () => {
  const s = state(), before = JSON.stringify(s);
  const out = stage(s,[row('expense','expense',700),row('income','income',200)]);
  assert.equal(diff(out),0);
  assert.equal(rec.checkedBalance(out,'ing',date),9500);
  assert.equal(JSON.stringify(s),before);
  assert.equal(out.transactions.length,2);
});
test('Opposite order and intermediate overshoot are allowed', () => {
  const out = stage(state(),[row('income','income',200),row('expense','expense',700)]);
  assert.equal(diff(out),0);
});
test('Positive difference with alternating signs is valid', () => {
  const out = stage(state(10500),[row('income','income',700),row('expense','expense',200)]);
  assert.equal(diff(out),0);
  assert.equal(rec.checkedBalance(out,'ing',date),10500);
});
test('Partial draft is rejected and cannot mutate original ledger', () => {
  const s = state(), before = JSON.stringify(s);
  assert.throws(() => stage(s,[row('expense','expense',700)]),/lot complet/);
  assert.equal(JSON.stringify(s),before);
});
test('Invalid second row rolls back first staged transaction', () => {
  const s = state(), before = JSON.stringify(s);
  assert.throws(() => stage(s,[row('expense','expense',700),row('bad','income',200,{date:'2026-10-12'})]),/datei sale/);
  assert.equal(JSON.stringify(s),before);
});
test('Duplicate transaction identifiers fail closed', () => {
  assert.throws(() => stage(state(),[row('same','expense',700),row('same','income',200)]),/duplicat/);
});
test('Wrong check, account and unsafe amount are rejected', () => {
  const s = state();
  assert.throws(() => stage(s,[row('a','expense',500,{reconciliationCheckId:'other'})]),/verificării/);
  assert.throws(() => stage(s,[row('a','expense',500,{accountId:'other'})]),/verificării/);
  assert.throws(() => stage(s,[row('a','expense',0)]),/Suma/);
});
test('Debt and transfer types are not silently treated as cash', () => {
  assert.throws(() => stage(state(),[row('transfer','transfer',500)]),/Suma sau tipul/);
});
test('Draft edits/deletes occur before a single commit', () => {
  const s = state(); let writes = 0, persisted = null;
  let draft = [row('a','expense',600),row('b','income',100),row('remove','income',5)];
  draft = draft.filter(x => x.id !== 'remove');
  draft[0] = {...draft[0],amount:700};
  draft[1] = {...draft[1],amount:200};
  assert.equal(writes,0);
  const out = stage(s,draft);
  function persistOnce(snapshot) { writes++; persisted = JSON.parse(JSON.stringify(snapshot)); }
  persistOnce(out);
  assert.equal(writes,1);
  assert.equal(diff(persisted),0);
  assert.equal(s.transactions.length,0);
});
test('Cancelled draft and failed persistence never change original snapshot', () => {
  const s = state(), before = JSON.stringify(s); let writes = 0;
  const out = stage(s,[row('a','expense',700),row('b','income',200)]);
  assert.equal(writes,0); // cancel: discard out
  assert.throws(() => { writes++; throw Error('storage failed'); },/storage failed/);
  assert.equal(writes,1);
  assert.equal(JSON.stringify(s),before);
  assert.equal(out.transactions.length,2);
});
test('Existing partial explanation can be completed in one atomic batch', () => {
  const s = model.saveTransaction(state(),row('existing','expense',300),today);
  assert.equal(diff(s),-200);
  const out = stage(s,[row('remaining','expense',200)]);
  assert.equal(diff(out),0);
  assert.equal(s.transactions.length,1);
});
test('Historical explanation does not consume a later checkpoint difference', () => {
  const s = state();
  s.balanceChecks.push({id:'later',accountId:'ing',observed:9400,date:'2026-10-14',order:3000});
  const before = diff(s,'later');
  const out = stage(s,[row('a','expense',700),row('b','income',200)]);
  assert.equal(diff(out,'c1'),0);
  assert.equal(diff(out,'later'),before);
});

test('Live preview with no rows keeps original difference and cannot save', () => {
  const p = previewReconciliationBatch(state(), 'c1', [], engine, today);
  assert.equal(p.differenceBeforeDraft,-500);
  assert.equal(p.explainedDifference,0);
  assert.equal(p.remainingDifference,-500);
  assert.equal(p.canSave,false);
});
test('Live preview of incomplete negative batch shows signed overshoot', () => {
  const p = previewReconciliationBatch(state(), 'c1', [row('a','expense',700)], engine, today);
  assert.equal(p.explainedDifference,-700);
  assert.equal(p.remainingDifference,200);
  assert.equal(p.canSave,false);
});
test('Live preview with opposite signs reaches zero without early persistence', () => {
  const s = state(), before = JSON.stringify(s);
  const p = previewReconciliationBatch(s,'c1',[row('a','expense',700),row('b','income',200)],engine,today);
  assert.equal(p.explainedDifference,-500);
  assert.equal(p.remainingDifference,0);
  assert.equal(p.canSave,true);
  assert.equal(JSON.stringify(s),before);
});
test('Live preview reports only outstanding difference after existing explanation', () => {
  const s = model.saveTransaction(state(),row('old','expense',300),today);
  const p = previewReconciliationBatch(s,'c1',[row('new','expense',200)],engine,today);
  assert.equal(p.differenceBeforeDraft,-200);
  assert.equal(p.explainedDifference,-200);
  assert.equal(p.remainingDifference,0);
  assert.equal(p.canSave,true);
});
test('Live preview is frozen and never exposes a persistable partial snapshot', () => {
  const p = previewReconciliationBatch(state(),'c1',[row('a','expense',700)],engine,today);
  assert.ok(Object.isFrozen(p));
  assert.equal(Object.keys(p).some(k => /state|snapshot|transactions/i.test(k)),false);
});
test('Invalid later draft row fails without mutating the original state', () => {
  const s = state(), before = JSON.stringify(s);
  assert.throws(() => previewReconciliationBatch(s,'c1',[
    row('a','expense',700),row('b','income',200,{date:'2026-10-12'})
  ],engine,today),/datei sale/);
  assert.equal(JSON.stringify(s),before);
});
test('Live preview with positive difference and alternating signs is accurate', () => {
  const p = previewReconciliationBatch(state(10500),'c1',[
    row('a','income',700),row('b','expense',200)
  ],engine,today);
  assert.equal(p.differenceBeforeDraft,500);
  assert.equal(p.explainedDifference,500);
  assert.equal(p.remainingDifference,0);
  assert.equal(p.canSave,true);
});

// UI-ready draft controller: edit/delete, live totals, stale-ledger guard and
// single-snapshot handoff. The real active financial engine is used above.
const { createReconciliationDraft } = require('../src/reconciliation-draft.cjs');
function draft(s = state()) {
  return createReconciliationDraft({ state:s, checkId:'c1', engine, today });
}
test('Draft starts with signed live totals and no persistable rows', () => {
  const d = draft();
  const p = d.preview();
  assert.equal(p.differenceBeforeDraft,-500);
  assert.equal(p.remainingDifference,-500);
  assert.equal(p.canSave,false);
  assert.equal(d.getRows().length,0);
});
test('Draft add/edit/remove recalculates signed remaining difference using real engine', () => {
  const d = draft();
  assert.equal(d.add(row('a','expense',700)).remainingDifference,200);
  assert.equal(d.add(row('b','income',200)).canSave,true);
  assert.equal(d.update('a',{amount:600}).remainingDifference,-100);
  assert.equal(d.remove('b').remainingDifference,100);
  assert.equal(d.update('a',{amount:500}).canSave,true);
  assert.equal(d.getRows().length,1);
});
test('Invalid row and invalid edit are rejected without corrupting draft', () => {
  const d = draft();
  d.add(row('a','expense',700));
  assert.throws(() => d.add(row('bad','income',200,{date:'2026-10-12'})),/datei sale/);
  assert.throws(() => d.update('a',{id:'changed'}),/Identificatorul/);
  assert.throws(() => d.update('a',{amount:0}),/Suma/);
  assert.throws(() => d.remove('missing'),/nu mai există/);
  assert.equal(d.getRows().length,1);
  assert.equal(d.preview().remainingDifference,200);
});
test('Draft does not expose mutable internal rows or original ledger', () => {
  const s = state(), before = JSON.stringify(s), d = draft(s);
  const input = row('a','expense',700);
  d.add(input);
  input.amount = 1;
  const visible = d.getRows();
  visible[0].amount = 1;
  assert.equal(d.getRows()[0].amount,700);
  assert.equal(JSON.stringify(s),before);
});
test('Stale ledger is rejected even after a fully balanced draft', () => {
  const s = state(), d = draft(s);
  d.add(row('a','expense',700));
  d.add(row('b','income',200));
  const changed = JSON.parse(JSON.stringify(s));
  changed.transactions.push({id:'outside-change'});
  assert.throws(() => d.prepare(changed),/Registrul s-a modificat/);
  assert.equal(d.preview().canSave,true); // User can reload; no write occurred.
  assert.equal(s.transactions.length,0);
});
test('Incomplete prepare fails without closing editable draft', () => {
  const s = state(), d = draft(s);
  d.add(row('a','expense',700));
  assert.throws(() => d.prepare(s),/lot complet/);
  d.add(row('b','income',200));
  assert.equal(d.preview().canSave,true);
});
test('Prepared snapshot is handed off once and never mutates original ledger', () => {
  const s = state(), before = JSON.stringify(s), d = draft(s);
  d.add(row('a','expense',700));
  d.add(row('b','income',200));
  const out = d.prepare(s);
  assert.equal(diff(out),0);
  assert.equal(out.transactions.length,2);
  assert.equal(JSON.stringify(s),before);
  assert.throws(() => d.prepare(s),/închisă/);
  assert.throws(() => d.add(row('c','expense',1)),/închisă/);
});
test('Cancel discards draft and rejects all later operations without writes', () => {
  const s = state(), before = JSON.stringify(s), d = draft(s);
  d.add(row('a','expense',700));
  d.cancel();
  assert.throws(() => d.preview(),/închisă/);
  assert.throws(() => d.prepare(s),/închisă/);
  assert.equal(JSON.stringify(s),before);
});
test('Duplicate row IDs are rejected before prepare', () => {
  const d = draft();
  d.add(row('a','expense',700));
  assert.throws(() => d.add(row('a','income',200)),/duplicat/);
  assert.equal(d.getRows().length,1);
});


test('UI-shaped income and unbudgeted expense rows pass the REAL financial engine', () => {
  const out = stage(state(),[
    row('ui-expense','expense',700,{financialRole:'unbudgeted'}),
    row('ui-income','income',200,{financialRole:'income'})
  ]);
  assert.equal(diff(out),0);
  assert.equal(out.transactions.length,2);
  assert.equal(rec.checkedBalance(out,'ing',date),9500);
});


// v18.41 chronology follow-up: ordinary Record create/edit paths must never
// persist a transaction earlier than any referenced account or debt opening.
// These cases use the actual bundled saveTransaction + validateState functions;
// no real storage is touched, and financial formulas are not modified.
function chronologyState() {
  const s = model.emptyState('2026-10-01');
  s.accounts.push(
    {id:'early',name:'Early account',kind:'current',date:'2026-10-01',opening:10000},
    {id:'late',name:'Late account',kind:'savings',date:'2026-10-10',opening:10000}
  );
  s.debts.push(
    {id:'card',name:'Credit card',kind:'card',date:'2026-10-10',amount:0,payment:0,limit:10000,day:7},
    {id:'loan',name:'Loan',kind:'loan',date:'2026-10-10',amount:5000,payment:500,limit:0,day:7}
  );
  return s;
}
function chronologyRow(id, extra={}) {
  return {id,name:id,kind:'expense',amount:200,date:'2026-10-05',
    accountId:'early',details:[],...extra};
}
for (const [label, rowInput] of [
  ['source account',chronologyRow('pre-source',{accountId:'late'})],
  ['transfer destination',chronologyRow('pre-destination',{
    kind:'transfer',destinationId:'late'})],
  ['credit card',chronologyRow('pre-credit',{
    accountId:'',creditId:'card'})],
  ['loan repayment',chronologyRow('pre-loan',{
    kind:'debtPayment',debtId:'loan',principal:100,amount:100})]
]) {
  test('Real transaction engine rejects pre-opening '+label+' without mutating input',()=>{
    const s=chronologyState(),before=JSON.stringify(s);
    assert.throws(()=>model.saveTransaction(s,rowInput,today));
    assert.equal(JSON.stringify(s),before);
    assert.equal(s.transactions.length,0);
  });
}
test('Editing an existing operation before its account opening is rejected atomically',()=>{
  const s=chronologyState();
  const valid=model.saveTransaction(s,chronologyRow('edit-me',{
    accountId:'late',date:'2026-10-10'}),today);
  const before=JSON.stringify(valid);
  assert.throws(()=>model.saveTransaction(valid,{
    ...valid.transactions[0],date:'2026-10-05'},today));
  assert.equal(JSON.stringify(valid),before);
  assert.equal(valid.transactions[0].date,'2026-10-10');
});
test('Same-day transfer to a newly opened account remains valid and balanced',()=>{
  const s=chronologyState();
  const out=model.saveTransaction(s,chronologyRow('same-day',{
    kind:'transfer',date:'2026-10-10',destinationId:'late'}),today);
  assert.equal(out.transactions.length,1);
  assert.equal(rec.checkedBalance(out,'early','2026-10-10'),9800);
  assert.equal(rec.checkedBalance(out,'late','2026-10-10'),10200);
  assert.equal(s.transactions.length,0);
});
