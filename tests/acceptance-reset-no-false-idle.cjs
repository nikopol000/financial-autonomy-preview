#!/usr/bin/env node
'use strict';
// SAFETY ACCEPTANCE (RED on WEB 18.74): a reset MUST NOT advertise idle
// if any encrypted record survives a nonthrowing storage deletion.
// Synthetic storage only. Never run against a user's browser origin.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const bundle=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle,'active bundle not found');
const source=fs.readFileSync(bundle,'utf8');
const start=source.indexOf('function faIdleReset(');
const end=source.indexOf('function faVaultConflict()',start);
assert.ok(start>=0&&end>start,'reset function boundaries missing');
const KEY='financial-autonomy.preview.key.v1';
const PAYLOAD='financial-autonomy.preview.payload.v1';
const RESET_MARKER='financial-autonomy.preview.reset.v1';
const ctx={KEY,PAYLOAD,RESET_MARKER,globalThis:{crypto:crypto.webcrypto}};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end),ctx,{filename:bundle});
for(const ignored of [PAYLOAD,KEY]){
  const data=new Map([[KEY,'SYNTHETIC_KEY'],[PAYLOAD,'SYNTHETIC_PAYLOAD']]);
  const storage={
    getItem(k){return data.has(k)?data.get(k):null},
    setItem(k,v){data.set(k,String(v))},
    removeItem(k){if(k!==ignored)data.delete(k)}
  };
  let error=null;
  try{ctx.faBeginCommittedReset(storage)}catch(e){error=e}
  const marker=storage.getItem(RESET_MARKER);
  assert.equal(storage.getItem(ignored),ignored===KEY?'SYNTHETIC_KEY':'SYNTHETIC_PAYLOAD',
    'fault injection did not retain record');
  // Accept either explicit failure or a pending/blocked marker; never false success.
  assert.ok(!/^idle-v2:[0-9a-f]{32}$/.test(marker||''),
    'UNSAFE false-success: idle-v2 committed with retained '+(ignored===KEY?'KEY':'PAYLOAD')+
    '; error='+(error?error.message:'none'));
}
console.log('PASS reset safety acceptance: no idle-v2 with residual encrypted records');
