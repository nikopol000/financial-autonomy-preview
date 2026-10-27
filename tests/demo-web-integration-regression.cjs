'use strict';
// WEB integration tests on the actual staged/active JS bundle. Synthetic storage only.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const active=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
const path=process.env.FA_DEMO_BUNDLE||active;
assert.ok(path,'Bundle missing');const source=fs.readFileSync(path,'utf8');
function factory(marker,end,globals={}){
  const at=source.indexOf(marker),start=source.lastIndexOf('__d(function(',at),stop=source.indexOf(end,at);
  assert.ok(at>=0&&start>=0&&stop>start,'Bundle module not found: '+marker);
  return vm.runInNewContext('('+source.slice(start+4,stop+1)+')',globals);
}
const rec={};factory('Object.defineProperty(_e,"comparePoint"','},207,[]);')({},()=>{},()=>{},null,{},rec,[]);
const model={};
const deps={206:{upgradeNames:s=>s,roleOf:t=>t.kind,attachTransactionName:(s,t)=>({s,t}),validateNames:()=>{}},207:rec,208:{validAppearance:()=>true},209:{isDashboardModuleId:()=>true},210:{},204:{today:()=> '2026-10-23',validDate:d=>/^\d{4}-\d{2}-\d{2}$/.test(d),validateState:()=>{}}};
factory('e.saveTransaction=function','},205,[206,207,208,209,210,204]);')({},id=>deps[id],()=>{},null,{},model,[206,207,208,209,210,204]);
const KEY='financial-autonomy.preview.key.v1',PAYLOAD='financial-autonomy.preview.payload.v1';
function storage(initial={}){
  const values={...initial};let writes=0;
  return {get length(){return Object.keys(values).length;},key:i=>Object.keys(values)[i]??null,
    getItem:k=>Object.hasOwn(values,k)?values[k]:null,
    setItem(k,v){writes++;values[k]=v;},removeItem(k){writes++;delete values[k];},
    inject(k,v){values[k]=v;},get writes(){return writes;}};
}
function platform(s,url='https://example.test/financial-autonomy-preview/'){
  const globalThis={localStorage:s,location:{href:url},history:{state:null,replaceState(_state,_title,next){globalThis.location.href=next}},crypto:{getRandomValues:a=>a,randomUUID:()=> 'demo-random'}};
  let vaultReads=0,vaultSaves=0,vaultResets=0;
  const vault={loadWebVault:()=>{vaultReads++;return model.emptyState('2026-10-23');},saveWebVault:()=>{vaultSaves++;},clearWebVault:()=>{vaultResets++;}};
  const api={};
  factory('e.unlock=async function(){return!0}','},309,[205,310]);',{globalThis,URL,Blob})({},id=>id===205?model:vault,()=>{},null,{},api,[205,310]);
  return {api,globalThis,counts:()=>({vaultReads,vaultSaves,vaultResets})};
}
let passed=0;
async function test(name,fn){try{await fn();passed++;console.log('PASS',name);}catch(err){console.error('FAIL',name,err.stack||err);process.exitCode=1;}}
(async()=>{
await test('Fresh browser opens demo with synthetic financial engine data and no writes',async()=>{
  const s=storage(),{api,counts}=platform(s),state=await api.load();
  assert.equal(api.isDemo(),true);assert.equal(state.accounts.length,2);assert.equal(state.transactions.length,3);
  assert.ok(state.transactions.every(t=>t.id.startsWith('demo-')));assert.equal(s.writes,0);assert.equal(counts().vaultReads,0);
});
await test('Demo edits and reloads are memory-only, with cloned snapshots',async()=>{
  const s=storage(),{api,counts}=platform(s),initial=await api.load();
  const next=model.saveTransaction(initial,{id:'demo-coffee',name:'Cafea',kind:'expense',amount:300,date:'2026-10-23',accountId:'demo-current',financialRole:'unbudgeted',details:[]},'2026-10-23');
  await api.save(next);assert.equal((await api.load()).transactions.length,4);
  next.accounts[0].opening=1;assert.equal((await api.load()).accounts[0].opening,350000);
  assert.equal(s.writes,0);assert.equal(counts().vaultSaves,0);
});
await test('Demo denies backup, import and reset without local writes',async()=>{
  const s=storage(),{api,counts}=platform(s);await api.load();
  await assert.rejects(api.exportText('{}'),/demo/i);
  await assert.rejects(api.pickText('backup'),/demo/i);
  await assert.rejects(api.resetData(),/demo/i);
  assert.equal(s.writes,0);assert.equal(counts().vaultResets,0);
});
await test('Real, orphan, blank, corrupt and legacy footprints never activate demo',async()=>{
  for(const values of [{[KEY]:'a'.repeat(64),[PAYLOAD]:'cipher'},{[KEY]:''},{[PAYLOAD]:''},{legacy:'x'},{other:'y'}]){
    const s=storage(values),{api,counts}=platform(s);await api.load();
    assert.equal(api.isDemo(),false);assert.equal(counts().vaultReads,1);assert.equal(s.writes,0);
  }
});
await test('Concurrent real data invalidates demo and cannot be overwritten',async()=>{
  const s=storage(),{api,counts}=platform(s),initial=await api.load();s.inject(PAYLOAD,'cipher');
  await assert.rejects(api.save(initial),/discarded/);await assert.rejects(api.load(),/ended/);
  assert.equal(api.demoStatus(),'blocked');assert.equal(s.writes,0);assert.equal(counts().vaultSaves,0);
});
await test('Exit requires explicit confirmation; only then load real mode',async()=>{
  const s=storage(),{api,globalThis,counts}=platform(s);await api.load();
  assert.throws(()=>api.startReal({confirmed:true}),/Discard demo/);
  api.exitDemo();await assert.rejects(api.load(),/ended/);
  assert.throws(()=>api.startReal(),/explicitly confirm/);
  api.startReal({confirmed:true});assert.equal(api.isDemo(),false);
  assert.ok(globalThis.location.href.includes('fa_real=1'));
  await api.load();assert.equal(counts().vaultReads,1);assert.equal(s.writes,0);
  const refreshed=platform(s,globalThis.location.href);await refreshed.api.load();
  assert.equal(refreshed.api.isDemo(),false);assert.equal(refreshed.counts().vaultReads,1);
});
await test('Unavailable local storage fails closed',async()=>{
  const s=storage(),{api,globalThis}=platform(s);
  Object.defineProperty(globalThis,'localStorage',{get(){throw Error('denied')}});
  await assert.rejects(api.load(),/denied/);
});
await test('User-visible demo banner, exit confirmation and cross-tab invalidation are wired',()=>{
  assert.ok(source.includes('DEMO · DATE FICTIVE'));
  assert.ok(source.includes('label:"Ieși din demo"'));
  assert.ok(source.includes('Date fictive, doar în memorie. Backup, diagnostic, import și ștergere dezactivate.'));
  assert.ok(source.includes('globalThis.confirm('));
  assert.ok(source.includes('addEventListener("storage",onStorage)'));
});
await test('Diagnostic, backup, restore and destructive reset have demo UI guards',()=>{
  assert.ok(source.includes('if(d.isDemo())throw Error("Diagnosticul nu poate fi exportat în demo.")'));
  assert.ok(source.includes('if(d.isDemo())throw Error("Backupul nu poate fi exportat în demo.")'));
  assert.ok(source.includes('disabled:d.isDemo()'));
  assert.ok(source.includes('disabled:R.isDemo()'));
});
await test('Diagnostic filename, embedded version and active bundle match HTML',()=>{
  const version=html.match(/<meta name="financial-autonomy-version" content="(\d+\.\d+)"/)?.[1];
  assert.ok(version,'HTML release version missing');
  assert.ok(source.includes('version:"'+version+'"'));
  assert.ok(source.includes('financial-autonomy-diagnostic-unic-v'+version+'.json'));
  assert.ok(path.includes('index-v0'+version.replace('.','')));
});
console.log(passed+'/10 WEB demo integration regressions passed');
if(passed!==10)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
