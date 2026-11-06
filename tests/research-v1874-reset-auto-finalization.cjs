#!/usr/bin/env node
'use strict';
// #29: SOURCE-EXTRACTED CHARACTERIZATION ONLY. A passing run reproduces
// a known unsafe auto-finalization path; it is NOT a safety acceptance PASS.
// Disposable in-memory storage only; never accesses browser/user data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const bundle=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle,'active versioned bundle not found');
const source=fs.readFileSync(bundle,'utf8');
const start=source.indexOf('function faIdleReset(');
const end=source.indexOf('function faVaultConflict()',start);
assert.ok(start>0&&end>start,'active reset functions not found; inspect manually');
const resetSource=source.slice(start,end);
for(const name of ['faFinishCommittedReset','faBeginCommittedReset','faPendingReset']){
  assert.match(resetSource,new RegExp('function '+name+'\\('));
}
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET='financial-autonomy.preview.reset.v1';
const context={KEY,PAYLOAD,RESET_MARKER:RESET,globalThis:{crypto:crypto.webcrypto}};
vm.createContext(context);
vm.runInContext(resetSource,context,{filename:bundle});
function fakeStore(){
 const map=new Map([[KEY,'SYNTHETIC_KEY_NOT_REAL'],[PAYLOAD,'SYNTHETIC_CIPHERTEXT_NOT_REAL']]);
 let denyKey=true;
 return {
  getItem:k=>map.has(k)?map.get(k):null,
  setItem:(k,v)=>map.set(k,String(v)),
  removeItem(k){if(k===KEY&&denyKey)throw new Error('synthetic SecurityError KEY remove');map.delete(k)},
  permitKeyRemoval(){denyKey=false}
 };
}
const store=fakeStore();
assert.throws(()=>context.faBeginCommittedReset(store),/synthetic SecurityError/);
assert.equal(store.getItem(PAYLOAD),null,'payload must have been deleted first');
assert.equal(store.getItem(KEY),'SYNTHETIC_KEY_NOT_REAL');
assert.match(store.getItem(RESET),/^pending-v2:[0-9a-f]{32}$/);
const pending=store.getItem(RESET);
// Models the existing load() auto-resume call after the fault disappears.
// This is deliberately NOT a browser reload or real-schema crypto test.
store.permitKeyRemoval();
context.faFinishCommittedReset(store);
assert.equal(store.getItem(KEY),null,'auto-resume removes remaining orphan key');
assert.equal(store.getItem(PAYLOAD),null);
assert.equal(store.getItem(RESET),'idle-v2:'+pending.slice('pending-v2:'.length));
console.log(JSON.stringify({
 characterization:'KNOWN_UNSAFE_AUTO_FINALIZATION_REPRODUCED',
 safetyPass:false, browserReloadTested:false, realSchemaTested:false,
 activeBundle:bundle
}));
