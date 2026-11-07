#!/usr/bin/env node
'use strict';
// Source-characterization only; no real data, no browser, NOT recovery safety acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const bundle=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle,'active immutable bundle missing');
const source=fs.readFileSync(bundle,'utf8');
const start=source.indexOf('function faIdleReset('),end=source.indexOf('function faVaultConflict()',start);
assert.ok(start>=0&&end>start,'reset function excerpt missing');
const KEY='financial-autonomy.preview.key.v1',PAYLOAD='financial-autonomy.preview.payload.v1',RESET_MARKER='financial-autonomy.preview.reset.v1';
const context={KEY,PAYLOAD,RESET_MARKER,globalThis:{crypto:crypto.webcrypto}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context,{filename:bundle});
for(const ignored of [PAYLOAD,KEY]){
 const state=new Map([[KEY,'SYNTHETIC_KEY'],[PAYLOAD,'SYNTHETIC_PAYLOAD']]);
 const operations=[];
 const storage={
  getItem(k){return state.has(k)?state.get(k):null},
  setItem(k,v){operations.push(['set',k]);state.set(k,String(v))},
  removeItem(k){operations.push(['remove',k]);if(k!==ignored)state.delete(k)}
 };
 let thrown=null;
 try{context.faBeginCommittedReset(storage)}catch(e){thrown=e}
 // Whether implementation throws or silently finalizes is evidence to characterize,
 // not a reason to accept the state as safe.
 const marker=storage.getItem(RESET_MARKER);
 // KNOWN UNSAFE CURRENT BEHAVIOR: removeItem may return without deleting.
 // The implementation does not read back either deletion; it can publish
 // idle-v2 even while an encrypted vault record remains on disk.
 assert.equal(thrown,null,'current implementation silently accepts lost deletion');
 assert.match(marker,/^idle-v2:[0-9a-f]{32}$/,'current implementation incorrectly commits idle');
 assert.deepEqual(operations.filter(x=>x[0]==='remove').map(x=>x[1]),[PAYLOAD,KEY]);
 assert.ok(storage.getItem(ignored)!==null,'ignored deletion must leave original bytes');
 assert.equal(storage.getItem(ignored),'SYNTHETIC_'+(ignored===KEY?'KEY':'PAYLOAD'));
 if(ignored===PAYLOAD)assert.equal(storage.getItem(PAYLOAD),'SYNTHETIC_PAYLOAD');
 if(ignored===KEY)assert.equal(storage.getItem(KEY),'SYNTHETIC_KEY');
 console.log(JSON.stringify({scenario:'silent-remove-'+(ignored===KEY?'key':'payload'),bundle,
   marker,remainingKey:storage.getItem(KEY)!==null,remainingPayload:storage.getItem(PAYLOAD)!==null,
   threw:Boolean(thrown),error:thrown?String(thrown.message):null,operations,
   syntheticOnly:true,safetyPass:false}));
}
