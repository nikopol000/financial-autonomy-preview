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
