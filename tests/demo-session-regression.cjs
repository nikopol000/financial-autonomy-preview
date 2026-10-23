'use strict';
// Contract tests only: demo is NOT yet integrated into active React bundle.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {makeDemoState,createDemoSession}=require('../src/demo-session.cjs');
const html=fs.readFileSync('index.html','utf8');
const path=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(path,'Active bundle missing');
const source=fs.readFileSync(path,'utf8');
function factory(marker,end){
  const at=source.indexOf(marker),start=source.lastIndexOf('__d(function(',at),stop=source.indexOf(end,at);
  assert.ok(at>=0&&start>=0&&stop>start,'Financial model missing');
  return vm.runInNewContext('('+source.slice(start+4,stop+1)+')');
}
const rec={};
factory('Object.defineProperty(_e,"comparePoint"','},207,[]);')({},()=>{},()=>{},null,{},rec,[]);
const model={};
const deps={206:{upgradeNames:s=>s,roleOf:t=>t.kind,attachTransactionName:(s,t)=>({s,t}),validateNames:()=>{}},207:rec,208:{validAppearance:()=>true},209:{isDashboardModuleId:()=>true},210:{},204:{today:()=> '2026-10-23',validDate:d=>/^\d{4}-\d{2}-\d{2}$/.test(d),validateState:()=>{}}};
factory('e.saveTransaction=function','},205,[206,207,208,209,210,204]);')({},id=>deps[id],()=>{},null,{},model,[206,207,208,209,210,204]);
const KEY='financial-autonomy.preview.key.v1',PAYLOAD='financial-autonomy.preview.payload.v1';
function storage(data={},fault=null){
  const values={...data};let writes=0;
  return {get length(){if(fault==='length')throw Error('denied');return Object.keys(values).length;},
    key:i=>Object.keys(values)[i]??null,
    getItem:k=>{if(fault==='get')throw Error('denied');return Object.hasOwn(values,k)?values[k]:null;},
    setItem(){writes++;throw Error('Demo must not persist');},
    removeItem(){writes++;throw Error('Demo must not delete');},
    inject:(k,v)=>{values[k]=v;},get writes(){return writes;}};
}
const engine={emptyState:model.emptyState,saveTransaction:model.saveTransaction,validateState:model.validateState};
const seed=()=>makeDemoState(engine);
const session=s=>createDemoSession({storage:s,initialState:seed(),validateState:model.validateState});
let passed=0;
function test(name,fn){try{fn();passed++;console.log('PASS',name);}catch(e){console.error('FAIL',name,e.stack||e.message);process.exitCode=1;}}
test('Synthetic seed is valid in the real financial model with 2 accounts and 3 operations',()=>{
  const s=seed();assert.equal(s.version,4);assert.equal(s.accounts.length,2);assert.equal(s.transactions.length,3);
  assert.ok(s.accounts.every(a=>a.id.startsWith('demo-')));assert.ok(s.transactions.every(t=>t.id.startsWith('demo-')));
});
test('Real, orphan, empty, legacy and unrelated local storage block demo without writes',()=>{
  for(const values of [{[KEY]:'a'.repeat(64),[PAYLOAD]:'cipher'},{[KEY]:''},{[PAYLOAD]:''},{'legacy-ledger':'saved'},{'other-app':'value'}]){
    const s=storage(values);assert.throws(()=>session(s),/Demo unavailable/);assert.equal(s.writes,0);
  }
});
test('Storage unavailable blocks initialization',()=>assert.throws(()=>session(storage({},'get')),/Demo unavailable/));
test('Editing demo transactions is in-memory only',()=>{
  const s=storage(),demo=session(s);
  const next=model.saveTransaction(demo.read(),{id:'demo-extra',name:'Cafea · DEMO',kind:'expense',amount:2500,date:'2026-10-23',accountId:'demo-current',details:[],financialRole:'unbudgeted'},'2026-10-23');
  demo.update(next);assert.equal(demo.read().transactions.length,4);assert.equal(s.writes,0);
});
test('Read snapshots cannot mutate demo session',()=>{
  const demo=session(storage()),copy=demo.read();copy.accounts[0].opening=1;
  assert.equal(demo.read().accounts[0].opening,350000);
});
test('Demo backup and diagnostic export always rejected',()=>{
  const demo=session(storage());assert.throws(()=>demo.exportBackup(),/cannot/);assert.throws(()=>demo.exportDiagnostic(),/cannot/);
});
test('Concurrent real vault appearance discards demo before update',()=>{
  const s=storage(),demo=session(s);s.inject(KEY,'a'.repeat(64));
  assert.throws(()=>demo.update(seed()),/discarded/);assert.equal(demo.mode,'blocked');assert.throws(()=>demo.read(),/ended/);assert.equal(s.writes,0);
});
test('Storage failure during demo invalidates session',()=>{
  let deny=false;const s=storage(),wrapper={get length(){if(deny)throw Error('blocked');return s.length;},key:i=>s.key(i),getItem:k=>s.getItem(k)};
  const demo=session(wrapper);deny=true;assert.throws(()=>demo.read(),/discarded/);assert.equal(demo.mode,'blocked');
});
test('Exit discards demo; real mode needs a second explicit confirmation',()=>{
  const s=storage(),demo=session(s);assert.throws(()=>demo.startReal({confirmed:true}),/Discard demo/);
  demo.exit();assert.throws(()=>demo.read(),/ended/);assert.throws(()=>demo.startReal(),/explicitly confirm/);
  assert.deepEqual(demo.startReal({confirmed:true}),{mode:'real',reloadRealVault:true});assert.equal(s.writes,0);
});
test('Invalid financial snapshot rejected without changing demo',()=>{
  const demo=session(storage());assert.throws(()=>demo.update({...demo.read(),version:999}));
  assert.equal(demo.read().version,4);
});
console.log(passed+'/10 isolated demo session tests passed');
if(passed!==10)process.exitCode=1;
