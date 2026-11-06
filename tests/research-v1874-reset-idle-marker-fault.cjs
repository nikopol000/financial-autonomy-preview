#!/usr/bin/env node
'use strict';
// Characterization only: synthetic storage; NOT a safety acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const bundle=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle,'active bundle missing');
const source=fs.readFileSync(bundle,'utf8');
const start=source.indexOf('function faIdleReset('),end=source.indexOf('function faVaultConflict()',start);
assert.ok(start>0&&end>start,'reset functions missing');
const KEY='financial-autonomy.preview.key.v1',PAYLOAD='financial-autonomy.preview.payload.v1',RESET_MARKER='financial-autonomy.preview.reset.v1';
const context={KEY,PAYLOAD,RESET_MARKER,globalThis:{crypto:crypto.webcrypto}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context,{filename:bundle});
const state=new Map([[KEY,'SYNTHETIC_KEY'],[PAYLOAD,'SYNTHETIC_PAYLOAD']]);
let deny=true;
const storage={
getItem(k){return state.has(k)?state.get(k):null},
setItem(k,v){if(deny&&k===RESET_MARKER&&String(v).startsWith('idle-v2:'))throw Error('INJECTED_IDLE_WRITE');state.set(k,String(v))},
removeItem(k){state.delete(k)}
};
assert.throws(()=>context.faBeginCommittedReset(storage),/INJECTED_IDLE_WRITE/);
assert.equal(storage.getItem(KEY),null);assert.equal(storage.getItem(PAYLOAD),null);
assert.match(storage.getItem(RESET_MARKER),/^pending-v2:[0-9a-f]{32}$/);
deny=false;context.faFinishCommittedReset(storage);
assert.match(storage.getItem(RESET_MARKER),/^idle-v2:[0-9a-f]{32}$/);
assert.equal(storage.getItem(KEY),null);assert.equal(storage.getItem(PAYLOAD),null);
console.log(JSON.stringify({result:'PASS CHARACTERIZATION',fault:'idle-marker-write',activeBundle:bundle,syntheticOnly:true,browserReloadTested:false,safetyPass:false}));
