'use strict';
// P1 #4: deterministic cross-version characterization, SYNTHETIC data only.
// These are intentionally KNOWN-UNSAFE results, not proof of safe legacy writes.
// Do not weaken assertions to claim a migration is safe.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');

const LEGACY = '_expo/static/js/web/index-v01833-demo-preload-guard-20261023.js';
const GUARDED = '_expo/static/js/web/index-v01849-responsive-nav-zoom-r2-20261026.js';
const html = fs.readFileSync('index.html', 'utf8');
const activePath = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(activePath, 'Active WEB bundle path missing');
const sources = [LEGACY, GUARDED, activePath].map(p => fs.readFileSync(p, 'utf8'));
// P1 #4: actual archived immutable versions, not mocked legacy behavior.
const EARLY_1827 = fs.readFileSync('_expo/static/js/web/index-v01827-vault-orphan-guard-20261023.js', 'utf8');
const GUARDED_1834 = fs.readFileSync('_expo/static/js/web/index-v01834-multitab-vault-guard-20261024.js', 'utf8');
const KEY = 'financial-autonomy.preview.key.v1';
const PAYLOAD = 'financial-autonomy.preview.payload.v1';
const RESET = 'financial-autonomy.preview.reset.v1';
const clone = x => JSON.parse(JSON.stringify(x));
const empty = () => ({version:4, accounts:[], transactions:[], balanceChecks:[]});
const model = {
  emptyState:empty,
  migrate(s){model.validateState(s);return s},
  validateState(s){
    assert.ok(s && s.version===4);
    for(const k of ['accounts','transactions','balanceChecks']) assert.ok(Array.isArray(s[k]));
    return s;
  },
  saveTransaction:(s,t)=>({...s,transactions:[...s.transactions,t]})
};
function storage(){
  const data = Object.create(null); let writes=0;
  return {
    getItem:k=>Object.hasOwn(data,k)?data[k]:null,
    setItem(k,v){writes++;data[k]=String(v)},
    removeItem(k){writes++;delete data[k]},
    key:i=>Object.keys(data)[i]??null,
    get length(){return Object.keys(data).length},
    get writes(){return writes},
    get data(){return data}
  };
}
// RESEARCH-ONLY adapter: redirects modern v1 API calls to separate synthetic v2 keys.
// This is NOT a migration implementation, production key format or recovery algorithm.
function researchV2View(backing){
  const names=new Map([
    [KEY,'financial-autonomy.preview.research.key.v2'],
    [PAYLOAD,'financial-autonomy.preview.research.payload.v2'],
    [RESET,'financial-autonomy.preview.research.reset.v2']
  ]);
  const map=k=>names.get(k)??k;
  return {
    getItem:k=>backing.getItem(map(k)),
    setItem:(k,v)=>backing.setItem(map(k),v),
    removeItem:k=>backing.removeItem(map(k)),
    key:i=>backing.key(i),
    get length(){return backing.length}
  };
}
function locks(){
  let tail=Promise.resolve();
  return {request(name,opts,fn){
    assert.equal(name,'financial-autonomy.preview.vault.v1');
    assert.equal(opts.mode,'exclusive');
    const run=tail.then(fn);
    tail=run.catch(()=>{});
    return run;
  }};
}
function tab(source, shared, lock){
  const globalThis = {
    localStorage:shared,
    location:{href:'https://example.test/?fa_real=1'},
    history:{state:null,replaceState(){}},
    crypto:{getRandomValues:x=>crypto.webcrypto.getRandomValues(x),randomUUID:()=>crypto.randomUUID()}
  };
  if(lock)globalThis.navigator={locks:lock};
  const context = {Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,
    TextDecoder,TextEncoder,Buffer,setTimeout,clearTimeout,URL,Blob,console,globalThis};
  const cache = new Map([[204,{validateState:model.validateState}],[205,model]]);
  function load(id){
    if(cache.has(id))return cache.get(id);
    const re = new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g');
    const matches=[...source.matchAll(re)];
    assert.equal(matches.length,1,'Expected Metro module '+id);
    const match=matches[0],start=source.lastIndexOf('__d(function(',match.index);
    assert.ok(start>=0,'Missing module '+id);
    const factory=vm.runInNewContext('('+source.slice(start+4,match.index+1)+')',context);
    const deps=match[1]?match[1].split(',').map(Number):[];
    const mod={exports:{}};
    cache.set(id,mod.exports);
    factory(globalThis,load,()=>{},null,mod,mod.exports,deps);
    cache.set(id,mod.exports);
    return mod.exports;
  }
  return load(309);
}
const entry=(id)=>({id,kind:'expense',amount:100,date:'2026-10-28',accountId:'synthetic'});
(async()=>{
  // Real AES-GCM, actual immutable Metro modules from 18.33 and active 18.62.
  const s=storage(),lock=locks(),legacy=tab(sources[0],s),modern=tab(sources[2],s,lock);
  const stale=clone(await legacy.load());
  await modern.load();
  await legacy.save({...stale,transactions:[entry('old-initial')]});
  const current=clone(await modern.load());
  await modern.save({...current,transactions:[...current.transactions,entry('modern-new')]});
  assert.equal(clone(await modern.load()).transactions.length,2);
  await legacy.save({...stale,transactions:[entry('legacy-stale')]});
  const overwritten=clone(await modern.load());
  assert.deepEqual(overwritten.transactions.map(t=>t.id),['legacy-stale'],
    'KNOWN UNSAFE: 18.33 stale writer overwrites current ledger despite current Web Locks');
  console.log('PASS KNOWN UNSAFE: 18.33 cached tab silently replaces 18.62 encrypted ledger');

  const preReset=clone(await legacy.load());
  await modern.resetData();
  assert.equal(s.getItem(KEY),null);
  assert.equal(s.getItem(PAYLOAD),null);
  assert.match(s.getItem(RESET),/^idle-v2:[0-9a-f]{32}$/);
  const epoch=s.getItem(RESET);
  await legacy.save(preReset);
  assert.equal(s.getItem(RESET),epoch,'Legacy write does not touch durable reset epoch');
  assert.deepEqual(clone(await modern.load()).transactions.map(t=>t.id),['legacy-stale'],
    'KNOWN UNSAFE: legacy 18.33 resurrects a deleted ledger after committed v2 reset');
  console.log('PASS KNOWN UNSAFE: 18.33 cached tab resurrects ledger after 18.62 reset');

  // Later guarded old code sees the idle-v2 marker but does not understand it.
  // This must fail closed and preserve the marker, not be treated as an empty vault.
  const s2=storage(),current2=tab(sources[2],s2,locks());
  await current2.load();
  await current2.save({...empty(),transactions:[entry('to-reset')]});
  await current2.resetData();
  const guarded=tab(sources[1],s2,locks());
  const before=clone(s2.data),writes=s2.writes;
  await assert.rejects(guarded.load(),/Marcaj|resetare|unknown/i);
  assert.deepEqual(clone(s2.data),before);
  assert.equal(s2.writes,writes);
  console.log('PASS FAIL CLOSED: 18.49 guarded cached tab cannot consume 18.62 idle-v2 reset marker');
  // PROTOTYPE ONLY: a separate authoritative v2 namespace is invisible to cached v1 writers.
  // This proves isolation of names, NOT crash-safe migration or detection of all divergent v1 writes.
  const s3=storage(),legacy3=tab(sources[0],s3),modernV2=tab(sources[2],researchV2View(s3),locks());
  await legacy3.load();
  await legacy3.save({...empty(),transactions:[entry('v1-before-cutover')]});
  await modernV2.load();
  await modernV2.save({...empty(),transactions:[entry('v2-authoritative')]});
  const v2Bytes=s3.getItem('financial-autonomy.preview.research.payload.v2');
  assert.ok(v2Bytes,'Research v2 ciphertext must exist');
  const v1Before=s3.getItem(PAYLOAD);
  await legacy3.save({...empty(),transactions:[entry('v1-divergent-after-cutover')]});
  assert.notEqual(s3.getItem(PAYLOAD),v1Before,'Legacy write diverges from cutover v1 snapshot');
  assert.equal(s3.getItem('financial-autonomy.preview.research.payload.v2'),v2Bytes,
    'Legacy v1 writer cannot overwrite isolated v2 ciphertext');
  assert.deepEqual(clone(await modernV2.load()).transactions.map(t=>t.id),['v2-authoritative']);
  assert.deepEqual(clone(await legacy3.load()).transactions.map(t=>t.id),['v1-divergent-after-cutover']);
  console.log('PASS PROTOTYPE ONLY: v2 namespace isolates ciphertext, while divergent v1 edits remain and need explicit conflict handling');

  const s4=storage(),legacy4=tab(sources[0],s4),modernV2Reset=tab(sources[2],researchV2View(s4),locks());
  await legacy4.load();
  await legacy4.save({...empty(),transactions:[entry('v1-before-reset')]});
  await modernV2Reset.load();
  await modernV2Reset.save({...empty(),transactions:[entry('v2-before-reset')]});
  await modernV2Reset.resetData();
  const v2Epoch=s4.getItem('financial-autonomy.preview.research.reset.v2');
  assert.match(v2Epoch,/^idle-v2:[0-9a-f]{32}$/);
  await legacy4.save({...empty(),transactions:[entry('v1-resurrected-after-v2-reset')]});
  assert.deepEqual(clone(await modernV2Reset.load()).transactions,[],
    'Legacy v1 resurrection cannot be promoted to authoritative v2 after reset');
  assert.equal(s4.getItem('financial-autonomy.preview.research.payload.v2'),null);
  assert.equal(s4.getItem('financial-autonomy.preview.research.reset.v2'),v2Epoch);
  await legacy4.resetData();
  assert.equal(s4.getItem('financial-autonomy.preview.research.reset.v2'),v2Epoch,
    'Legacy v1 reset cannot erase isolated v2 tombstone');
  console.log('PASS PROTOTYPE ONLY: cached v1 save/reset cannot resurrect or clear isolated v2 after v2 reset');
  // RESEARCH ONLY: deletion of v1 bytes after cutover is observable drift, not a reason to change v2 authority.
  const s5=storage(),legacy5=tab(sources[0],s5),modernV2Deletion=tab(sources[2],researchV2View(s5),locks());
  await legacy5.load();
  await legacy5.save({...empty(),transactions:[entry('v1-before-deletion')]});
  await modernV2Deletion.load();
  await modernV2Deletion.save({...empty(),transactions:[entry('v2-kept-after-deletion')]});
  const v1Tuple=store=>[KEY,PAYLOAD,RESET].map(k=>store.getItem(k));
  const fingerprint=tuple=>crypto.createHash('sha256').update(JSON.stringify(tuple)).digest('hex');
  const baselineFingerprint=fingerprint(v1Tuple(s5));
  await legacy5.resetData();
  assert.notEqual(fingerprint(v1Tuple(s5)),baselineFingerprint,
    'Deleting legacy v1 keys is an observable post-cutover tuple divergence');
  assert.deepEqual(clone(await modernV2Deletion.load()).transactions.map(t=>t.id),
    ['v2-kept-after-deletion'],'Legacy v1 deletion must not affect isolated v2');
  console.log('PASS PROTOTYPE ONLY: legacy v1 deletion is observable divergence without changing v2 authority');

  // RESEARCH ONLY: an ABA raw-byte restoration defeats even a full KEY/PAYLOAD/RESET fingerprint.
  // This simulates a legacy snapshot being restored byte-for-byte after a real 18.33 save.
  // Normal AES-GCM saves use fresh randomness; this is a storage rollback counterexample,
  // not a claim that normal 18.33 save automatically produces identical ciphertext.
  const s6=storage(),legacy6=tab(sources[0],s6),modernV2ABA=tab(sources[2],researchV2View(s6),locks());
  await legacy6.load();
  await legacy6.save({...empty(),transactions:[entry('v1-baseline')]});
  await modernV2ABA.load();
  await modernV2ABA.save({...empty(),transactions:[entry('v2-authoritative')]});
  const originalTuple=[KEY,PAYLOAD,RESET].map(k=>[k,s6.getItem(k)]);
  const originalFingerprint=fingerprint(v1Tuple(s6));
  await legacy6.save({...empty(),transactions:[entry('v1-transient-after-cutover')]});
  assert.notEqual(fingerprint(v1Tuple(s6)),originalFingerprint,
    'The real 18.33 write must first produce observable divergence');
  for(const [key,value] of originalTuple){
    if(value===null)s6.removeItem(key);
    else s6.setItem(key,value);
  }
  assert.equal(fingerprint(v1Tuple(s6)),originalFingerprint,
    'A byte-for-byte restoration hides the intervening legacy write from fingerprint-only checks');
  assert.deepEqual(clone(await modernV2ABA.load()).transactions.map(t=>t.id),
    ['v2-authoritative'],'Isolated v2 stays authoritative despite v1 ABA');
  console.log('PASS PROTOTYPE ONLY: v1 ABA raw-byte restoration defeats tuple fingerprint; no complete legacy-edit detection');
  // KNOWN UNSAFE: WEB 18.27 predates any cooperating-tab revision fencing.
  // Keep this test separate from 18.33: the older immutable release is a
  // realistic cached writer and must be included in a future v2 migration gate.
  const s7=storage(),legacy27=tab(EARLY_1827,s7),modern7=tab(sources[2],s7,locks());
  const stale27=clone(await legacy27.load());
  await legacy27.save({...stale27,transactions:[entry('early27-baseline')]});
  const snapshot27=clone(await modern7.load());
  await modern7.save({...snapshot27,transactions:[...snapshot27.transactions,entry('modern-after-27')]});
  assert.deepEqual(clone(await modern7.load()).transactions.map(t=>t.id),
    ['early27-baseline','modern-after-27']);
  await legacy27.save({...stale27,transactions:[entry('early27-stale')]});
  assert.deepEqual(clone(await modern7.load()).transactions.map(t=>t.id),['early27-stale'],
    'KNOWN UNSAFE: cached 18.27 overwrites a newer 18.62 transaction');
  console.log('PASS KNOWN UNSAFE: cached 18.27 stale save overwrites modern ledger');

  // Partial mitigation: cached WEB 18.34 knows revisions and Web Locks, so a
  // sequential stale write is rejected without mutating the current ciphertext.
  const s8=storage(),modern8=tab(sources[2],s8,locks()),guarded34=tab(GUARDED_1834,s8,locks());
  await modern8.load();
  await modern8.save({...empty(),transactions:[entry('initial-34')]});
  const stale34=clone(await guarded34.load());
  await modern8.save({...empty(),transactions:[entry('modern-after-34')]});
  const ciphertextBefore=s8.getItem(PAYLOAD),writesBefore=s8.writes;
  await assert.rejects(guarded34.save({...stale34,transactions:[...stale34.transactions,entry('stale34')]}),
    /modificate|filă|Reîncarcă/i);
  assert.equal(s8.writes,writesBefore,'18.34 must not write after rejecting stale revision');
  assert.equal(s8.getItem(PAYLOAD),ciphertextBefore,'18.34 must preserve current ciphertext');
  assert.deepEqual(clone(await modern8.load()).transactions.map(t=>t.id),['modern-after-34']);
  console.log('PASS PARTIAL GUARD: 18.34 rejects sequential stale save with zero writes');

  // KNOWN UNSAFE: WEB 18.34 has no knowledge of WEB 18.62 idle-v2 reset marker.
  // After explicitly reloading the old client, the v1 KEY/PAYLOAD tuple appears
  // empty and a new first save may recreate a ledger despite the modern tombstone.
  const s9=storage(),modern9=tab(sources[2],s9,locks()),guarded34Reset=tab(GUARDED_1834,s9,locks());
  await modern9.load();
  await modern9.save({...empty(),transactions:[entry('pre-reset-34')]});
  await modern9.resetData();
  const resetEpoch34=s9.getItem(RESET);
  assert.match(resetEpoch34,/^idle-v2:[0-9a-f]{32}$/);
  const oldAfterReset=clone(await guarded34Reset.load());
  assert.deepEqual(oldAfterReset.transactions,[],'18.34 sees empty v1 tuple after modern reset');
  await guarded34Reset.save({...oldAfterReset,transactions:[entry('resurrected-by-34')]});
  assert.equal(s9.getItem(RESET),resetEpoch34,'18.34 does not erase modern reset marker');
  assert.deepEqual(clone(await modern9.load()).transactions.map(t=>t.id),['resurrected-by-34'],
    'KNOWN UNSAFE: cached 18.34 can resurrect data after 18.62 reset');
  console.log('PASS KNOWN UNSAFE: cached 18.34 first save resurrects after modern reset');

  console.log('10/10 cross-version synthetic characterizations passed: 4 KNOWN UNSAFE, 1 FAIL CLOSED, 1 PARTIAL GUARD, 4 RESEARCH-ONLY');
})().catch(err=>{console.error(err);process.exitCode=1});
