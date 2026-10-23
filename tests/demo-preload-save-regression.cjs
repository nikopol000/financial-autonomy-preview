'use strict';
// Regression: a fresh browser must never write a real vault before demo initialization
// or an explicit fa_real=1 transition. Uses the actual web platform module with synthetic storage.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const active=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
const path=process.env.FA_DEMO_BUNDLE||active;
assert.ok(path&&path.startsWith('_expo/static/js/web/'),'WEB bundle missing');
const source=fs.readFileSync(path,'utf8');
const marker='e.unlock=async function(){return!0}';
const at=source.indexOf(marker),start=source.lastIndexOf('__d(function(',at),end=source.indexOf('},309,[205,310]);',at);
assert.ok(at>=0&&start>=0&&end>start,'WEB platform module missing');
const factory=vm.runInNewContext('('+source.slice(start+4,end+1)+')',{URL,Blob});
const KEY='financial-autonomy.preview.key.v1',PAYLOAD='financial-autonomy.preview.payload.v1';
function storage(initial={}){
 const data={...initial};let writes=0;
 return {get length(){return Object.keys(data).length;},key:i=>Object.keys(data)[i]??null,
 getItem:k=>Object.hasOwn(data,k)?data[k]:null,
 setItem(k,v){writes++;data[k]=v;},removeItem(k){writes++;delete data[k];},
 get writes(){return writes;},get data(){return data;}};
}
function platform(s,url='https://example.test/financial-autonomy-preview/'){
 const globalThis={localStorage:s,location:{href:url},history:{state:null,replaceState(_state,_title,next){globalThis.location.href=next}},crypto:{getRandomValues:a=>a,randomUUID:()=> 'synthetic-id'}};
 let realSaves=0,realLoads=0;
 const model={validateState:()=>{},emptyState:()=>({version:4,accounts:[],transactions:[]}),
 saveTransaction:(state,row)=>({...state,transactions:[...state.transactions,row]})};
 const vault={loadWebVault:()=>{realLoads++;return model.emptyState();},
 saveWebVault:()=>{realSaves++;},clearWebVault:()=>{}};
 const api={};
 factory({},id=>id===205?model:vault,()=>{},null,{},api,[205,310]);
 return {api,globalThis,counts:()=>({realSaves,realLoads})};
}
let passed=0;
async function test(name,fn){try{await fn();passed++;console.log('PASS',name)}catch(e){console.error('FAIL',name,e.stack||e);process.exitCode=1}}
(async()=>{
 await test('Fresh preload save is rejected without initializing a real vault',async()=>{
  const s=storage(),{api,counts}=platform(s);
  await assert.rejects(api.save({version:4}),/demo|real|inițial|modul/i);
  assert.equal(counts().realSaves,0);assert.equal(s.writes,0);
 });
 await test('Fresh preload save does not prevent subsequent safe demo startup',async()=>{
  const s=storage(),{api,counts}=platform(s);
  await assert.rejects(api.save({version:4}));
  const demo=await api.load();assert.equal(api.isDemo(),true);
  assert.equal(demo.accounts.length,2);assert.equal(demo.transactions.length,3);
  assert.equal(counts().realSaves,0);assert.equal(s.writes,0);
 });
 await test('Explicit fa_real=1 on a fresh browser permits real-mode saves',async()=>{
  const s=storage(),{api,counts}=platform(s,'https://example.test/?fa_real=1');
  await api.save({version:4});assert.equal(counts().realSaves,1);
  await api.load();assert.equal(api.isDemo(),false);assert.equal(counts().realLoads,1);
 });
 await test('Existing vault footprint still takes the guarded real-vault path',async()=>{
  const s=storage({[KEY]:'a'.repeat(64),[PAYLOAD]:'synthetic-ciphertext'}),{api,counts}=platform(s);
  await api.load();assert.equal(api.isDemo(),false);assert.equal(counts().realLoads,1);
  await api.save({version:4});assert.equal(counts().realSaves,1);
 });
 await test('Active demo save never reaches the real vault',async()=>{
  const s=storage(),{api,counts}=platform(s);
  const demo=await api.load();await api.save(demo);
  assert.equal(api.isDemo(),true);assert.equal(counts().realSaves,0);assert.equal(s.writes,0);
 });
 await test('Explicit exit and confirmation enable the real save path',async()=>{
  const s=storage(),{api,counts,globalThis}=platform(s);
  await api.load();api.exitDemo();
  await assert.rejects(api.save({version:4}),/ended/);
  api.startReal({confirmed:true});
  await api.save({version:4});
  assert.equal(counts().realSaves,1);
  assert.ok(globalThis.location.href.includes('fa_real=1'));
 });
 console.log(passed+'/6 demo preload-save regressions passed ('+path+')');
 if(passed!==6)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
