'use strict';
// Integration regression: active WEB v18.29 real financial model + real vault
// load/save adapter. Only the cryptographic primitive and storage are mocked;
// this test does NOT claim real-browser or AES-GCM verification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stageReconciliationBatch } = require('../src/reconciliation-batch.cjs');
const html = fs.readFileSync('index.html','utf8');
const bundle = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle, 'Active bundle missing');
const source = fs.readFileSync(bundle, 'utf8');
function factory(marker, terminator) {
  const at = source.indexOf(marker);
  const start = source.lastIndexOf('__d(function(', at);
  const end = source.indexOf(terminator, at);
  assert.ok(at >= 0 && start >= 0 && end > start, 'Missing real bundle module: '+marker);
  return vm.runInNewContext('('+source.slice(start+4,end+1)+')');
}
const rec = {};
factory('Object.defineProperty(_e,"comparePoint"', '},207,[]);')({},()=>{},()=>{},null,{},rec,[]);
const model = {};
const dependencies = {
  206:{upgradeNames:s=>s,roleOf:t=>t.kind,attachTransactionName:(s,t)=>({s,t}),validateNames:()=>{}},
  207:rec,208:{validAppearance:()=>true},209:{isDashboardModuleId:()=>true},210:{},
  204:{today:()=> '2026-10-23',validDate:d=>/^\d{4}-\d{2}-\d{2}$/.test(d),validateState:()=>{}}
};
factory('e.saveTransaction=function', '},205,[206,207,208,209,210,204]);')(
  {},id=>dependencies[id],()=>{},null,{},model,[206,207,208,209,210,204]
);
const vault = {};
// Deliberately NOT real encryption. The real vault's load/save/key/error paths
// are tested with a reversible envelope so ledger invariants can be asserted.
const cryptoStub = {
  hexToBytes:()=>new Uint8Array(32),
  bytesToHex:()=> 'b'.repeat(64),
  seal:text=> 'mock-envelope:'+encodeURIComponent(text),
  unseal:text=> decodeURIComponent(text.slice('mock-envelope:'.length))
};
factory('e.loadWebVault=function(o)', '},310,[205,311]);')(
  {},id=>id===205?model:cryptoStub,()=>{},null,{},vault,[205,311]
);
const engine = {saveTransaction:model.saveTransaction,checkRows:rec.checkRows,checkedBalance:rec.checkedBalance};
const today='2026-10-23', date='2026-10-13', key='financial-autonomy.preview.key.v1',
  payload='financial-autonomy.preview.payload.v1';
const randomBytes=n=>new Uint8Array(n).fill(7);
function initial() {
  const s=model.emptyState('2026-10-01');
  s.accounts.push({id:'ing',name:'ING',kind:'current',date:'2026-10-01',opening:10000});
  s.balanceChecks.push({id:'c1',accountId:'ing',observed:9500,date,order:3000});
  return s;
}
const row=(id,kind,amount)=>({
  id,name:id,kind,amount,date,accountId:'ing',reconciliationCheckId:'c1',
  details:[],financialRole:kind==='income'?'income':'unbudgeted'
});
const difference=(s,id='c1')=>rec.checkRows(s,'ing').find(c=>c.id===id).difference;
const stage=s=>stageReconciliationBatch(s,'c1',[row('expense','expense',700),row('income','income',200)],engine,today);
function storage() {
  const data={}; let fail=false, writes=0;
  return {
    getItem:k=>data[k]??null,
    setItem:(k,v)=>{writes++;if(fail&&k===payload)throw Error('quota');data[k]=v;},
    failNextPayload:()=>{fail=true;},
    get writes(){return writes;},
    get data(){return data;}
  };
}
function test(name,fn) {
  try {fn();console.log('PASS',name);}
  catch(err){console.error('FAIL',name,err.stack||err.message);process.exitCode=1;}
}
test('History contains exactly two linked signed rows, ordered once, with unchanged observed balance',()=>{
  const s=initial(),before=JSON.stringify(s),out=stage(s);
  assert.equal(JSON.stringify(s),before);
  assert.equal(out.transactions.length,2);
  assert.equal(JSON.stringify(out.transactions.map(t=>t.id)),JSON.stringify(['expense','income']));
  assert.equal(JSON.stringify(out.transactions.map(t=>t.amount)),JSON.stringify([700,200]));
  assert.equal(JSON.stringify(out.transactions.map(t=>t.reconciliationCheckId)),JSON.stringify(['c1','c1']));
  assert.ok(out.transactions[0].order<out.transactions[1].order);
  assert.equal(difference(out),0);
  assert.equal(rec.checkedBalance(out,'ing',date),9500);
  assert.equal(out.balanceChecks[0].observed,9500);
});
test('Vault save and reload retain both history rows, checked balance and zero remainder',()=>{
  const store=storage(),out=stage(initial());
  vault.saveWebVault(store,out,randomBytes);
  assert.equal(store.writes,2); // new key + one payload, never one write per row
  const reloaded=vault.loadWebVault(store);
  assert.equal(JSON.stringify(reloaded),JSON.stringify(out));
  assert.equal(reloaded.transactions.length,2);
  assert.equal(difference(reloaded),0);
  assert.equal(rec.checkedBalance(reloaded,'ing',date),9500);
});
test('Voiding one linked row after reload reopens discrepancy, persists audit and never changes observed balance',()=>{
  const store=storage();vault.saveWebVault(store,stage(initial()),randomBytes);
  const loaded=vault.loadWebVault(store),income=loaded.transactions.find(t=>t.id==='income');
  const corrected=model.saveTransaction(loaded,{...income,voided:true},today);
  assert.equal(corrected.transactions.length,2);
  assert.equal(difference(corrected),200);
  assert.equal(corrected.audit.at(-1).action,'Anulare');
  assert.equal(corrected.audit.at(-1).before.id,'income');
  assert.equal(rec.checkedBalance(corrected,'ing',date),9500);
  vault.saveWebVault(store,corrected,randomBytes);
  const reloaded=vault.loadWebVault(store);
  assert.equal(reloaded.transactions.length,2);
  assert.equal(reloaded.transactions.find(t=>t.id==='income').voided,true);
  assert.equal(reloaded.audit.length,1);
  assert.equal(difference(reloaded),200);
});
test('Editing a linked transaction corrects rather than duplicates history and records audit',()=>{
  const s=stage(initial()),expense=s.transactions.find(t=>t.id==='expense');
  const edited=model.saveTransaction(s,{...expense,amount:600},today);
  assert.equal(edited.transactions.length,2);
  assert.equal(difference(edited),-100);
  assert.equal(edited.audit.at(-1).action,'Corectare');
  assert.equal(edited.audit.at(-1).before.amount,700);
  const restored=model.saveTransaction(edited,{...edited.transactions.find(t=>t.id==='expense'),amount:700},today);
  assert.equal(restored.transactions.length,2);
  assert.equal(restored.audit.length,2);
  assert.equal(difference(restored),0);
  assert.equal(rec.checkedBalance(restored,'ing',date),9500);
});
test('Current engine audit adjustment on retroactive void is characterized, not silently changed',()=>{
  const s=initial();s.balanceChecks.push({id:'later',accountId:'ing',observed:9400,date:'2026-10-14',order:3000});
  const laterBefore=difference(s,'later'),out=stage(s);
  assert.equal(difference(out,'later'),laterBefore);
  const voided=model.saveTransaction(out,{...out.transactions.find(t=>t.id==='income'),voided:true},today);
  assert.equal(difference(voided,'c1'),200);
  // The real engine's income-correction audit shifts a later check difference by
  // -200 after voiding the historical income. This is a CHARACTERIZATION,
  // not an approved financial rule. Flag for product review before changing it.
  assert.equal(difference(voided,'later'),laterBefore-200);
  assert.equal(rec.checkedBalance(voided,'ing','2026-10-14'),9200);
  assert.equal(voided.balanceChecks.find(c=>c.id==='later').observed,9400);
});
test('Failed payload update preserves previously saved ledger and does not expose partial batch',()=>{
  const store=storage(),base=initial();
  vault.saveWebVault(store,base,randomBytes);
  const oldPayload=store.data[payload],oldKey=store.data[key];
  store.failNextPayload();
  assert.throws(()=>vault.saveWebVault(store,stage(base),randomBytes),/nu a putut salva/);
  assert.equal(store.data[payload],oldPayload);
  assert.equal(store.data[key],oldKey);
  const reloaded=vault.loadWebVault(store);
  assert.equal(reloaded.transactions.length,0);
  assert.equal(difference(reloaded),-500);
});


// CHARACTERIZATION ONLY (#2): active financial semantics are NOT approved.
// Real module 207 currently applies the most recent income-audit offset to
// each later observed check. A void followed by an undo is not an involution
// for those later checks, despite the original transaction being restored.
test('Three observed checks: income void then undo leaves a +200 drift on later checks (contract unresolved)',()=>{
  const s=initial();
  s.balanceChecks.push(
    {id:'c2',accountId:'ing',observed:9400,date:'2026-10-14',order:3000},
    {id:'c3',accountId:'ing',observed:9000,date:'2026-10-16',order:3000}
  );
  const originalObserved=Array.from(s.balanceChecks,c=>c.observed);
  const staged=stage(s);
  assert.deepEqual(['c1','c2','c3'].map(id=>difference(staged,id)),[0,-100,-400]);
  const income=staged.transactions.find(t=>t.id==='income');
  const voided=model.saveTransaction(staged,{...income,voided:true},today);
  assert.deepEqual(['c1','c2','c3'].map(id=>difference(voided,id)),[200,-300,-600]);
  const restored=model.saveTransaction(voided,{
    ...voided.transactions.find(t=>t.id==='income'),voided:false
  },today);
  assert.equal(restored.transactions.length,2);
  assert.equal(restored.transactions.find(t=>t.id==='income').voided,false);
  assert.equal(restored.audit.length,2);
  assert.deepEqual(Array.from(restored.balanceChecks,c=>c.observed),originalObserved);
  // c1 returns to zero, but later differences do NOT return to their baseline.
  // These numbers are observations of the existing engine, NOT desired values.
  assert.deepEqual(['c1','c2','c3'].map(id=>difference(restored,id)),[0,100,-200]);
  assert.deepEqual(
    ['c1','c2','c3'].map(id=>rec.checkedBalance(restored,'ing',
      restored.balanceChecks.find(c=>c.id===id).date)),
    [9500,9600,9200]
  );
  const store=storage();
  vault.saveWebVault(store,restored,randomBytes);
  const reloaded=vault.loadWebVault(store);
  assert.equal(reloaded.audit.length,2);
  assert.deepEqual(['c1','c2','c3'].map(id=>difference(reloaded,id)),[0,100,-200]);
  assert.deepEqual(Array.from(reloaded.balanceChecks,c=>c.observed),originalObserved);
});

test('Three observed checks: expense edit and exact reversal retain baseline later differences',()=>{
  const s=initial();
  s.balanceChecks.push(
    {id:'c2',accountId:'ing',observed:9400,date:'2026-10-14',order:3000},
    {id:'c3',accountId:'ing',observed:9000,date:'2026-10-16',order:3000}
  );
  const staged=stage(s);
  const expense=staged.transactions.find(t=>t.id==='expense');
  const edited=model.saveTransaction(staged,{...expense,amount:600},today);
  assert.deepEqual(['c1','c2','c3'].map(id=>difference(edited,id)),[-100,-100,-400]);
  const restored=model.saveTransaction(edited,{
    ...edited.transactions.find(t=>t.id==='expense'),amount:700
  },today);
  assert.deepEqual(['c1','c2','c3'].map(id=>difference(restored,id)),[0,-100,-400]);
  assert.equal(restored.transactions.length,2);
  assert.equal(restored.audit.length,2);
});


// ISSUE #2 — independent historical edit characterization, NOT a target contract.
// Only synthetic fixtures, actual immutable v18.41 modules 205/207, no user data.
function threeChecks() {
  const s=initial();
  s.balanceChecks.push(
    {id:'c2',accountId:'ing',observed:9400,date:'2026-10-14',order:3000},
    {id:'c3',accountId:'ing',observed:9000,date:'2026-10-16',order:3000}
  );
  return s;
}
const threeDifferences=s=>['c1','c2','c3'].map(id=>difference(s,id));

test('Income amount 200→300→200: later checks drift -100 despite exact undo (#2 characterization)',()=>{
  const base=stage(threeChecks()),original=JSON.stringify(base);
  assert.deepEqual(threeDifferences(base),[0,-100,-400]);
  const income=base.transactions.find(t=>t.id==='income');
  const edited=model.saveTransaction(base,{...income,amount:300},today);
  assert.deepEqual(threeDifferences(edited),[-100,0,-300]);
  assert.equal(edited.audit.at(-1).before.amount,200);
  const restored=model.saveTransaction(edited,{
    ...edited.transactions.find(t=>t.id==='income'),amount:200
  },today);
  assert.equal(restored.transactions.find(t=>t.id==='income').amount,200);
  assert.equal(restored.audit.length,2);
  assert.deepEqual(threeDifferences(restored),[0,-200,-500]);
  assert.deepEqual(Array.from(restored.balanceChecks,c=>c.observed),[9500,9400,9000]);
  assert.equal(JSON.stringify(base),original);
  const store=storage();vault.saveWebVault(store,restored,randomBytes);
  assert.deepEqual(threeDifferences(vault.loadWebVault(store)),[0,-200,-500]);
});

test('Editing date of a linked income is rejected, leaving checks and ledger unchanged',()=>{
  const base=stage(threeChecks()),before=JSON.stringify(base);
  const income=base.transactions.find(t=>t.id==='income');
  assert.throws(()=>model.saveTransaction(base,{...income,date:'2026-10-14'},today));
  assert.equal(JSON.stringify(base),before);
  assert.deepEqual(threeDifferences(base),[0,-100,-400]);
});

test('Observed check edit and exact undo restore differences; checkAudit records both',()=>{
  const base=stage(threeChecks()),before=JSON.stringify(base);
  const c2=base.balanceChecks.find(c=>c.id==='c2');
  const edited=model.saveBalanceCheck(base,{...c2,observed:9300},today);
  assert.deepEqual(threeDifferences(edited),[0,-200,-300]);
  assert.equal(edited.checkAudit.length,1);
  const restored=model.saveBalanceCheck(edited,{
    ...edited.balanceChecks.find(c=>c.id==='c2'),observed:9400
  },today);
  assert.deepEqual(threeDifferences(restored),[0,-100,-400]);
  assert.equal(restored.checkAudit.length,2);
  assert.equal(JSON.stringify(base),before);
});


// ISSUE #2 — independent cross-account safety invariant and repeated-edit
// characterization. This test uses only synthetic data and the active WEB
// financial model. It does not authorize an income audit-offset formula.
function withIndependentAccount() {
  const s=threeChecks();
  s.accounts.push({id:'cash',name:'Synthetic cash',kind:'cash',date:'2026-10-01',opening:5000});
  s.balanceChecks.push(
    {id:'b1',accountId:'cash',observed:4900,date:'2026-10-13',order:4000},
    {id:'b2',accountId:'cash',observed:4800,date:'2026-10-16',order:4000}
  );
  return s;
}
const otherDifferences=s=>Array.from(rec.checkRows(s,'cash'),c=>[c.id,c.difference]);
const otherBalances=s=>['2026-10-13','2026-10-16'].map(d=>rec.checkedBalance(s,'cash',d));

test('Income edits and undo on ING never alter independent cash account checks (#2 safety)',()=>{
  const base=withIndependentAccount();
  const before=JSON.stringify(base);
  const b=otherDifferences(base),balances=otherBalances(base);
  const staged=stage(base);
  assert.deepEqual(otherDifferences(staged),b);
  assert.deepEqual(otherBalances(staged),balances);
  const income=staged.transactions.find(t=>t.id==='income');
  const up=model.saveTransaction(staged,{...income,amount:300},today);
  const further=model.saveTransaction(up,{
    ...up.transactions.find(t=>t.id==='income'),amount:400
  },today);
  const undone=model.saveTransaction(further,{
    ...further.transactions.find(t=>t.id==='income'),amount:200
  },today);
  for (const state of [up,further,undone]) {
    assert.deepEqual(otherDifferences(state),b);
    assert.deepEqual(otherBalances(state),balances);
    assert.deepEqual(Array.from(state.balanceChecks.filter(c=>c.accountId==='cash'),c=>c.observed),[4900,4800]);
  }
  assert.equal(JSON.stringify(base),before);
  assert.equal(undone.audit.length,3);
  assert.equal(undone.transactions.find(t=>t.id==='income').amount,200);
  const store=storage();
  vault.saveWebVault(store,undone,randomBytes);
  const reloaded=vault.loadWebVault(store);
  assert.deepEqual(otherDifferences(reloaded),b);
  assert.deepEqual(otherBalances(reloaded),balances);
  assert.equal(reloaded.audit.length,3);
});

test('Repeated 200→300→400→200 income edit keeps observed anchors and persists engine output (#2 characterization)',()=>{
  const base=stage(threeChecks()),observed=base.balanceChecks.map(c=>c.observed);
  const snapshots=[base],steps=[300,400,200];
  for (const amount of steps) {
    const previous=snapshots.at(-1),income=previous.transactions.find(t=>t.id==='income');
    snapshots.push(model.saveTransaction(previous,{...income,amount},today));
  }
  assert.deepEqual(snapshots.map(s=>s.transactions.find(t=>t.id==='income').amount),[200,300,400,200]);
  assert.deepEqual(snapshots.map(s=>s.audit.length),[0,1,2,3]);
  for (const state of snapshots) assert.deepEqual(state.balanceChecks.map(c=>c.observed),observed);
  const outputs=snapshots.map(threeDifferences);
  console.log('CHARACTERIZATION #2 repeated income differences (cents): '+JSON.stringify(outputs));
  const store=storage();vault.saveWebVault(store,snapshots.at(-1),randomBytes);
  assert.deepEqual(threeDifferences(vault.loadWebVault(store)),outputs.at(-1));
  // The exact later-check difference is deliberately NOT asserted as desired
  // accounting behavior; issue #2 requires an approved financial contract.
});


// ISSUE #2 — synthetic mixed checkAudit + inter-account transfer + historical
// income edit. This characterizes the existing WEB engine, not an approved
// financial contract. No actual account data or browser storage is accessed.
test('Transfer between checked accounts and checkAudit reversal isolate cash while income undo still drifts (#2)',()=>{
  const original=withIndependentAccount(),originalJSON=JSON.stringify(original);
  const staged=stage(original);
  const transfer=model.saveTransaction(staged,{
    id:'transfer-1',name:'Synthetic ING to cash',kind:'transfer',amount:300,
    date:'2026-10-15',accountId:'ing',destinationId:'cash',
    details:[],financialRole:'transfer'
  },today);
  assert.equal(transfer.transactions.length,3);
  assert.equal(transfer.audit.length,0);
  assert.deepEqual(threeDifferences(transfer),[0,-100,-100]);
  assert.deepEqual(otherDifferences(transfer),[['b1',-100],['b2',-400]]);
  const totalBefore=rec.checkedBalance(staged,'ing','2026-10-15')+
    rec.checkedBalance(staged,'cash','2026-10-15');
  const totalAfter=rec.checkedBalance(transfer,'ing','2026-10-15')+
    rec.checkedBalance(transfer,'cash','2026-10-15');
  assert.equal(totalBefore,14300);
  assert.equal(totalAfter,totalBefore,'Internal transfer must not create owned money');
  const cashBaseline=otherDifferences(transfer);
  const cashBalances=otherBalances(transfer);
  const c2=transfer.balanceChecks.find(c=>c.id==='c2');
  const changedCheck=model.saveBalanceCheck(transfer,{...c2,observed:9300},today);
  assert.deepEqual(threeDifferences(changedCheck),[0,-200,0]);
  const restoredCheck=model.saveBalanceCheck(changedCheck,{
    ...changedCheck.balanceChecks.find(c=>c.id==='c2'),observed:9400
  },today);
  assert.equal(restoredCheck.checkAudit.length,2);
  assert.deepEqual(threeDifferences(restoredCheck),[0,-100,-100]);
  const income=restoredCheck.transactions.find(t=>t.id==='income');
  const changedIncome=model.saveTransaction(restoredCheck,{...income,amount:300},today);
  const restoredIncome=model.saveTransaction(changedIncome,{
    ...changedIncome.transactions.find(t=>t.id==='income'),amount:200
  },today);
  assert.equal(restoredIncome.transactions.find(t=>t.id==='income').amount,200);
  assert.equal(restoredIncome.transactions.find(t=>t.id==='transfer-1').amount,300);
  assert.equal(restoredIncome.checkAudit.length,2);
  assert.equal(restoredIncome.audit.length,2);
  assert.deepEqual(Array.from(restoredIncome.balanceChecks,c=>[c.id,c.observed]),[
    ['c1',9500],['c2',9400],['c3',9000],['b1',4900],['b2',4800]
  ]);
  assert.deepEqual(otherDifferences(restoredIncome),cashBaseline);
  assert.deepEqual(otherBalances(restoredIncome),cashBalances);
  // Current-engine characterization ONLY: the exact income reversal leaves
  // both later ING check differences 100 cents below the transfer baseline.
  assert.deepEqual(threeDifferences(restoredIncome),[0,-200,-200]);
  const store=storage();vault.saveWebVault(store,restoredIncome,randomBytes);
  const loaded=vault.loadWebVault(store);
  assert.deepEqual(threeDifferences(loaded),[0,-200,-200]);
  assert.deepEqual(otherDifferences(loaded),cashBaseline);
  assert.equal(loaded.checkAudit.length,2);
  assert.equal(loaded.audit.length,2);
  assert.equal(JSON.stringify(original),originalJSON);
});


// ISSUE #2 — synthetic cross-account transfer correction/void characterization.
// These are conservation and exact-state-reversal checks against the active
// financial engine, not approval to change historical check-audit formulas.
test('Transfer 300→500→300 and void→restore across two checked accounts conserve money and restore check differences (#2)',()=>{
  const original=withIndependentAccount(), originalJSON=JSON.stringify(original);
  const staged=stage(original), dateOfTransfer='2026-10-15';
  const total=s=>rec.checkedBalance(s,'ing',dateOfTransfer)+
    rec.checkedBalance(s,'cash',dateOfTransfer);
  const baselineTotal=total(staged);
  const transfer=model.saveTransaction(staged,{
    id:'transfer-correction',name:'Synthetic transfer',kind:'transfer',
    amount:300,date:dateOfTransfer,accountId:'ing',destinationId:'cash',
    details:[],financialRole:'transfer'
  },today);
  const ingBaseline=threeDifferences(transfer);
  const cashBaseline=otherDifferences(transfer);
  const checkedBaseline=[
    rec.checkedBalance(transfer,'ing',dateOfTransfer),
    rec.checkedBalance(transfer,'cash',dateOfTransfer)
  ];
  const observed=Array.from(transfer.balanceChecks,c=>[c.id,c.observed]);
  assert.equal(total(transfer),baselineTotal,'Transfer must not mint or destroy owned money');
  assert.equal(transfer.audit.length,0);

  const edit=model.saveTransaction(transfer,{
    ...transfer.transactions.find(t=>t.id==='transfer-correction'),amount:500
  },today);
  assert.equal(edit.audit.at(-1).action,'Corectare');
  assert.equal(edit.audit.at(-1).before.amount,300);
  assert.equal(total(edit),baselineTotal);
  assert.equal(rec.checkedBalance(edit,'ing',dateOfTransfer),checkedBaseline[0]-200);
  assert.equal(rec.checkedBalance(edit,'cash',dateOfTransfer),checkedBaseline[1]+200);
  const undoEdit=model.saveTransaction(edit,{
    ...edit.transactions.find(t=>t.id==='transfer-correction'),amount:300
  },today);
  assert.equal(total(undoEdit),baselineTotal);
  assert.deepEqual(threeDifferences(undoEdit),ingBaseline);
  assert.deepEqual(otherDifferences(undoEdit),cashBaseline);

  const voided=model.saveTransaction(undoEdit,{
    ...undoEdit.transactions.find(t=>t.id==='transfer-correction'),voided:true
  },today);
  assert.equal(voided.audit.at(-1).action,'Anulare');
  assert.equal(total(voided),baselineTotal);
  assert.equal(rec.checkedBalance(voided,'ing',dateOfTransfer),checkedBaseline[0]+300);
  assert.equal(rec.checkedBalance(voided,'cash',dateOfTransfer),checkedBaseline[1]-300);
  const restored=model.saveTransaction(voided,{
    ...voided.transactions.find(t=>t.id==='transfer-correction'),voided:false
  },today);
  assert.equal(restored.audit.length,4);
  assert.equal(restored.transactions.length,3);
  assert.equal(restored.transactions.find(t=>t.id==='transfer-correction').amount,300);
  assert.equal(restored.transactions.find(t=>t.id==='transfer-correction').voided,false);
  assert.equal(total(restored),baselineTotal);
  assert.deepEqual(threeDifferences(restored),ingBaseline);
  assert.deepEqual(otherDifferences(restored),cashBaseline);
  assert.deepEqual(Array.from(restored.balanceChecks,c=>[c.id,c.observed]),observed);
  assert.equal(JSON.stringify(original),originalJSON);

  const store=storage();vault.saveWebVault(store,restored,randomBytes);
  const reloaded=vault.loadWebVault(store);
  assert.equal(reloaded.audit.length,4);
  assert.deepEqual(threeDifferences(reloaded),ingBaseline);
  assert.deepEqual(otherDifferences(reloaded),cashBaseline);
  assert.equal(total(reloaded),baselineTotal);
});


// ISSUE #2 — transfer destination reassignment and credit-card boundary.
// Actual immutable v18.41 modules 205/207; synthetic balances only.
// These assertions characterize existing account/debt arithmetic and reject
// invalid destinations. They do NOT approve historical income-audit semantics.
function reassignmentFixture() {
  const s=model.emptyState('2026-10-01');
  for (const [id,kind,opening] of [
    ['ing','current',10000],['cash','cash',5000],['savings','savings',3000]
  ]) s.accounts.push({id,name:id,kind,date:'2026-10-01',opening});
  s.debts.push({
    id:'card',name:'Synthetic card',kind:'card',date:'2026-10-01',
    amount:2000,payment:0,limit:10000,day:1
  });
  for (const [id,order,first,second] of [
    ['ing',3000,9500,9400],['cash',4000,4900,4800],
    ['savings',5000,2900,2800],['card',6000,2000,2000]
  ]) s.balanceChecks.push(
    {id:id+'-1',accountId:id,observed:first,date:'2026-10-13',order},
    {id:id+'-2',accountId:id,observed:second,date:'2026-10-16',order}
  );
  return s;
}
const reassignmentBalances=s=>['ing','cash','savings','card']
  .map(id=>rec.checkedBalance(s,id,'2026-10-15'));
const reassignmentDifferences=s=>['ing','cash','savings','card']
  .map(id=>Array.from(rec.checkRows(s,id),row=>row.difference));
const reassignmentNetWorth=s=>{
  const [ing,cash,savings,card]=reassignmentBalances(s);
  return ing+cash+savings-card; // Credit liability, never available owned money.
};

test('Reassign transfer cash→savings→card→cash: checks, net worth and exact undo (#2)',()=>{
  const original=reassignmentFixture(),unchanged=JSON.stringify(original);
  const baselineNetWorth=reassignmentNetWorth(original);
  const row={
    id:'transfer-reassigned',name:'Synthetic transfer',kind:'transfer',
    amount:300,date:'2026-10-15',accountId:'ing',
    destinationId:'cash',details:[],financialRole:'transfer'
  };
  const toCash=model.saveTransaction(original,row,today);
  const observed=Array.from(toCash.balanceChecks,c=>[c.id,c.observed]);
  assert.deepEqual(reassignmentBalances(toCash),[9200,5200,2900,2000]);
  assert.deepEqual(reassignmentDifferences(toCash),[
    [-500,200],[-100,-400],[-100,-100],[0,0]
  ]);
  const toSavings=model.saveTransaction(toCash,{
    ...toCash.transactions.find(t=>t.id===row.id),destinationId:'savings'
  },today);
  assert.deepEqual(reassignmentBalances(toSavings),[9200,4900,3200,2000]);
  assert.deepEqual(reassignmentDifferences(toSavings),[
    [-500,200],[-100,-100],[-100,-400],[0,0]
  ]);
  const toCard=model.saveTransaction(toSavings,{
    ...toSavings.transactions.find(t=>t.id===row.id),
    destinationId:null,destinationCreditId:'card'
  },today);
  assert.deepEqual(reassignmentBalances(toCard),[9200,4900,2900,1700]);
  assert.deepEqual(reassignmentDifferences(toCard),[
    [-500,200],[-100,-100],[-100,-100],[0,300]
  ]);
  // Card payment decreases owned checking AND the credit liability by 300;
  // its available credit is not an additional owned asset.
  for (const s of [toCash,toSavings,toCard])
    assert.equal(reassignmentNetWorth(s),baselineNetWorth);
  const restored=model.saveTransaction(toCard,{
    ...toCard.transactions.find(t=>t.id===row.id),
    destinationId:'cash',destinationCreditId:null
  },today);
  assert.deepEqual(reassignmentBalances(restored),reassignmentBalances(toCash));
  assert.deepEqual(reassignmentDifferences(restored),reassignmentDifferences(toCash));
  assert.equal(reassignmentNetWorth(restored),baselineNetWorth);
  assert.deepEqual(Array.from(restored.balanceChecks,c=>[c.id,c.observed]),observed);
  assert.equal(restored.audit.length,3);
  assert.equal(restored.transactions.length,1);
  assert.equal(JSON.stringify(original),unchanged);
  const store=storage();vault.saveWebVault(store,restored,randomBytes);
  const loaded=vault.loadWebVault(store);
  assert.deepEqual(reassignmentBalances(loaded),reassignmentBalances(toCash));
  assert.deepEqual(reassignmentDifferences(loaded),reassignmentDifferences(toCash));
  assert.equal(loaded.audit.length,3);
});

test('Invalid transfer reassignment rejects both destinations, unknown/same account and pre-opening date (#2)',()=>{
  const original=reassignmentFixture();
  const toCash=model.saveTransaction(original,{
    id:'transfer-guard',name:'Synthetic transfer',kind:'transfer',
    amount:300,date:'2026-10-15',accountId:'ing',
    destinationId:'cash',details:[],financialRole:'transfer'
  },today);
  const before=JSON.stringify(toCash),row=toCash.transactions[0];
  const rejected=[
    {destinationId:'cash',destinationCreditId:'card'},
    {destinationId:'missing',destinationCreditId:null},
    {destinationId:'ing',destinationCreditId:null},
    {destinationId:null,destinationCreditId:'missing'},
    {destinationId:'cash',destinationCreditId:null,date:'2026-09-30'}
  ];
  for (const patch of rejected) {
    assert.throws(()=>model.saveTransaction(toCash,{...row,...patch},today));
    assert.equal(JSON.stringify(toCash),before,'Rejected edit must not mutate ledger');
  }
  assert.equal(toCash.audit.length,0);
  assert.equal(toCash.transactions.length,1);
});


// ISSUE #2 — transfer SOURCE reassignment with independently checked accounts.
// Real bundled v18.41 engine; these tests characterize current behavior only.
test('Reassign transfer source ING→savings→cash→ING: independent checks, net worth and persisted exact undo (#2)',()=>{
  const original=reassignmentFixture(),originalJSON=JSON.stringify(original);
  const baselineNetWorth=reassignmentNetWorth(original);
  const row={
    id:'source-reassigned',name:'Synthetic source correction',kind:'transfer',
    amount:300,date:'2026-10-15',accountId:'ing',
    destinationId:'cash',details:[],financialRole:'transfer'
  };
  const fromIng=model.saveTransaction(original,row,today);
  const observed=Array.from(fromIng.balanceChecks,c=>[c.id,c.observed]);
  assert.deepEqual(reassignmentBalances(fromIng),[9200,5200,2900,2000]);
  const fromSavings=model.saveTransaction(fromIng,{
    ...fromIng.transactions.find(t=>t.id===row.id),accountId:'savings'
  },today);
  assert.deepEqual(reassignmentBalances(fromSavings),[9500,5200,2600,2000]);
  assert.deepEqual(reassignmentDifferences(fromSavings),[
    [-500,-100],[-100,-400],[-100,200],[0,0]
  ]);
  // Moving both ends in one correction is not an income or expense.
  const fromCash=model.saveTransaction(fromSavings,{
    ...fromSavings.transactions.find(t=>t.id===row.id),
    accountId:'cash',destinationId:'savings'
  },today);
  assert.deepEqual(reassignmentBalances(fromCash),[9500,4600,3200,2000]);
  assert.deepEqual(reassignmentDifferences(fromCash),[
    [-500,-100],[-100,200],[-100,-400],[0,0]
  ]);
  for(const state of [fromIng,fromSavings,fromCash])
    assert.equal(reassignmentNetWorth(state),baselineNetWorth);
  const restored=model.saveTransaction(fromCash,{
    ...fromCash.transactions.find(t=>t.id===row.id),
    accountId:'ing',destinationId:'cash'
  },today);
  assert.deepEqual(reassignmentBalances(restored),reassignmentBalances(fromIng));
  assert.deepEqual(reassignmentDifferences(restored),reassignmentDifferences(fromIng));
  assert.deepEqual(Array.from(restored.balanceChecks,c=>[c.id,c.observed]),observed);
  assert.equal(restored.transactions.length,1);
  assert.equal(restored.audit.length,3);
  assert.equal(reassignmentNetWorth(restored),baselineNetWorth);
  assert.equal(JSON.stringify(original),originalJSON);
  const store=storage();vault.saveWebVault(store,restored,randomBytes);
  const loaded=vault.loadWebVault(store);
  assert.deepEqual(reassignmentBalances(loaded),reassignmentBalances(fromIng));
  assert.deepEqual(reassignmentDifferences(loaded),reassignmentDifferences(fromIng));
  assert.equal(loaded.audit.length,3);
});

test('Invalid transfer source reassignment rejects unknown, same destination, card debt and later-opened account without mutation (#2)',()=>{
  const original=reassignmentFixture();
  original.accounts.push({
    id:'late',name:'Late synthetic account',kind:'current',
    opening:1000,date:'2026-10-16'
  });
  const toCash=model.saveTransaction(original,{
    id:'source-guard',name:'Synthetic source guard',kind:'transfer',
    amount:300,date:'2026-10-15',accountId:'ing',
    destinationId:'cash',details:[],financialRole:'transfer'
  },today);
  const before=JSON.stringify(toCash),row=toCash.transactions[0];
  for(const patch of [
    {accountId:'missing'},
    {accountId:'cash'},
    {accountId:'card'},
    {accountId:'late'},
    {accountId:'savings',date:'2026-09-30'}
  ]) {
    assert.throws(()=>model.saveTransaction(toCash,{...row,...patch},today));
    assert.equal(JSON.stringify(toCash),before,'Rejected source edit must not mutate ledger');
  }
  assert.equal(toCash.transactions.length,1);
  assert.equal(toCash.audit.length,0);
});


//
// ISSUE #2 — credit/overdraft transfer sources and card-to-card boundaries.
// Synthetic only, using the actual active immutable financial engine. These
// tests characterize existing behavior, not a new credit-accounting contract.
function creditSourceFixture() {
  const state=reassignmentFixture();
  for(const [id,kind,amount,order] of [
    ['card-b','card',1000,7000],
    ['overdraft','overdraft',500,8000]
  ]) {
    state.debts.push({
      id,name:'Synthetic '+id,kind,date:'2026-10-01',
      amount,payment:0,limit:10000,day:1
    });
    for(const [suffix,day] of [['1','2026-10-13'],['2','2026-10-16']])
      state.balanceChecks.push({
        id:id+'-'+suffix,accountId:id,observed:amount,date:day,order
      });
  }
  return state;
}
const creditSourceIds=['ing','cash','savings','card','card-b','overdraft'];
const creditSourceBalances=s=>creditSourceIds.map(id=>rec.checkedBalance(s,id,'2026-10-15'));
const creditSourceDifferences=s=>creditSourceIds.map(id=>
  Array.from(rec.checkRows(s,id),row=>row.difference));
const creditSourceNetWorth=s=>{
  const [ing,cash,savings,card,cardB,overdraft]=creditSourceBalances(s);
  return ing+cash+savings-card-cardB-overdraft;
};

test('Credit-card→cash transfer source reassigned to overdraft and restored: no minted money, checks and vault undo (#2)',()=>{
  const original=creditSourceFixture(),unchanged=JSON.stringify(original);
  const netWorth=creditSourceNetWorth(original);
  const fromCard=model.saveTransaction(original,{
    id:'credit-source-cash',name:'Synthetic credit to cash',kind:'transfer',
    amount:300,date:'2026-10-15',accountId:'',creditId:'card',
    destinationId:'cash',details:[],financialRole:'transfer'
  },today);
  const observed=Array.from(fromCard.balanceChecks,c=>[c.id,c.observed]);
  assert.deepEqual(creditSourceBalances(fromCard),[9500,5200,2900,2300,1000,500]);
  assert.deepEqual(Array.from(rec.checkRows(fromCard,'card'),c=>c.difference),[0,-300]);
  assert.equal(creditSourceNetWorth(fromCard),netWorth);
  const fromOverdraft=model.saveTransaction(fromCard,{
    ...fromCard.transactions[0],creditId:'overdraft'
  },today);
  assert.deepEqual(creditSourceBalances(fromOverdraft),[9500,5200,2900,2000,1000,800]);
  assert.deepEqual(Array.from(rec.checkRows(fromOverdraft,'overdraft'),c=>c.difference),[0,-300]);
  assert.equal(creditSourceNetWorth(fromOverdraft),netWorth);
  const restored=model.saveTransaction(fromOverdraft,{
    ...fromOverdraft.transactions[0],creditId:'card'
  },today);
  assert.deepEqual(creditSourceBalances(restored),creditSourceBalances(fromCard));
  assert.deepEqual(creditSourceDifferences(restored),creditSourceDifferences(fromCard));
  assert.deepEqual(Array.from(restored.balanceChecks,c=>[c.id,c.observed]),observed);
  assert.equal(restored.audit.length,2);
  assert.equal(restored.transactions.length,1);
  assert.equal(creditSourceNetWorth(restored),netWorth);
  assert.equal(JSON.stringify(original),unchanged);
  const store=storage();vault.saveWebVault(store,restored,randomBytes);
  const loaded=vault.loadWebVault(store);
  assert.deepEqual(creditSourceBalances(loaded),creditSourceBalances(fromCard));
  assert.deepEqual(creditSourceDifferences(loaded),creditSourceDifferences(fromCard));
  assert.equal(loaded.audit.length,2);
});

test('Card-to-card source correction, void and restore preserve two debt checks and owned net worth (#2)',()=>{
  const original=creditSourceFixture(),netWorth=creditSourceNetWorth(original);
  const fromCard=model.saveTransaction(original,{
    id:'credit-source-card',name:'Synthetic card-to-card',kind:'transfer',
    amount:300,date:'2026-10-15',accountId:'',creditId:'card',
    destinationCreditId:'card-b',details:[],financialRole:'transfer'
  },today);
  assert.deepEqual(creditSourceBalances(fromCard),[9500,4900,2900,2300,700,500]);
  assert.deepEqual(Array.from(rec.checkRows(fromCard,'card'),c=>c.difference),[0,-300]);
  assert.deepEqual(Array.from(rec.checkRows(fromCard,'card-b'),c=>c.difference),[0,300]);
  const fromOverdraft=model.saveTransaction(fromCard,{
    ...fromCard.transactions[0],creditId:'overdraft'
  },today);
  assert.deepEqual(creditSourceBalances(fromOverdraft),[9500,4900,2900,2000,700,800]);
  const restored=model.saveTransaction(fromOverdraft,{
    ...fromOverdraft.transactions[0],creditId:'card'
  },today);
  const voided=model.saveTransaction(restored,{...restored.transactions[0],voided:true},today);
  assert.deepEqual(creditSourceBalances(voided),creditSourceBalances(original));
  const unvoided=model.saveTransaction(voided,{...voided.transactions[0],voided:false},today);
  assert.deepEqual(creditSourceBalances(unvoided),creditSourceBalances(fromCard));
  assert.deepEqual(creditSourceDifferences(unvoided),creditSourceDifferences(fromCard));
  for(const state of [fromCard,fromOverdraft,restored,voided,unvoided])
    assert.equal(creditSourceNetWorth(state),netWorth);
  assert.equal(unvoided.audit.length,4);
  assert.deepEqual(Array.from(unvoided.balanceChecks,c=>[c.id,c.observed]),
    Array.from(original.balanceChecks,c=>[c.id,c.observed]));
  const store=storage();vault.saveWebVault(store,unvoided,randomBytes);
  assert.deepEqual(creditSourceDifferences(vault.loadWebVault(store)),creditSourceDifferences(fromCard));
});

test('Invalid credit source/destination edits reject without mutating checked ledger (#2)',()=>{
  const original=creditSourceFixture();
  original.debts.push({
    id:'loan',name:'Synthetic loan',kind:'loan',date:'2026-10-01',
    amount:5000,payment:0,limit:0,day:1
  });
  const active=model.saveTransaction(original,{
    id:'credit-source-guard',name:'Synthetic guarded transfer',kind:'transfer',
    amount:300,date:'2026-10-15',accountId:'',creditId:'card',
    destinationCreditId:'card-b',details:[],financialRole:'transfer'
  },today);
  const before=JSON.stringify(active),row=active.transactions[0];
  for(const patch of [
    {creditId:'missing'},
    {creditId:'loan'},
    {creditId:'card-b'},
    {accountId:'ing'},
    {creditId:'overdraft',accountId:'cash'},
    {destinationCreditId:'missing'},
    {destinationCreditId:'loan'},
    {destinationCreditId:'card',creditId:'card'},
    {date:'2026-09-30'}
  ]) {
    assert.throws(()=>model.saveTransaction(active,{...row,...patch},today));
    assert.equal(JSON.stringify(active),before,'Rejected credit edit must not mutate ledger');
  }
  assert.equal(active.audit.length,0);
  assert.equal(active.transactions.length,1);
});
