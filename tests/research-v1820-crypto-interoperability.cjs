#!/usr/bin/env node
'use strict';
// Research-only: genuine archived/current AES-GCM cross-version compatibility.
// Synthetic data only; no browser storage, backup, or application mutations.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const archived='_expo/static/js/web/index-v01820-history-back-navigation-20261014.js';
const html=fs.readFileSync('index.html','utf8');
const active=html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(active,'active immutable bundle missing');
function cryptoModule(file){
  const source=fs.readFileSync(file,'utf8');
  const cache=new Map();
  const globals={Uint8Array,Uint16Array,Uint32Array,Int32Array,ArrayBuffer,DataView,
    TextEncoder,TextDecoder,Buffer,console,globalThis:{crypto:crypto.webcrypto}};
  function load(id){
    if(cache.has(id))return cache.get(id);
    const re=new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g');
    const matches=[...source.matchAll(re)];
    assert.equal(matches.length,1,file+' Metro module '+id+' ambiguous');
    const match=matches[0],start=source.lastIndexOf('__d(function(',match.index);
    assert.ok(start>=0,file+' factory '+id+' missing');
    const factory=vm.runInNewContext('('+source.slice(start+4,match.index+1)+')',globals);
    const deps=match[1]?match[1].split(',').map(Number):[];
    const module={exports:{}};
    cache.set(id,module.exports);
    factory(globals.globalThis,load,()=>{},null,module,module.exports,deps);
    cache.set(id,module.exports);
    return module.exports;
  }
  return load(311);
}
const old=cryptoModule(archived),current=cryptoModule(active);
const key=new Uint8Array(crypto.randomBytes(32));
const random=n=>new Uint8Array(crypto.randomBytes(n));
const message='Synthetic cross-version ledger: șțîăâ € 1250';
for(const [label,writer,reader] of [
  ['archived-to-active',old,current],
  ['active-to-archived',current,old]
]){
  const envelope=writer.seal(message,key,random);
  assert.equal(reader.unseal(envelope,key),message,label+' round trip failed');
  const parsed=JSON.parse(envelope);
  assert.equal(parsed.v,1,label+' format changed');
  const tampered={...parsed,data:(parsed.data[0]==='0'?'1':'0')+parsed.data.slice(1)};
  assert.throws(()=>reader.unseal(JSON.stringify(tampered),key),label+' tamper accepted');
  assert.throws(()=>reader.unseal(envelope,random(32)),label+' wrong key accepted');
  console.log('PASS',label,'authentic AES-GCM interoperability and tamper rejection');
}
console.log(JSON.stringify({status:'PASS',scope:'synthetic-crypto-module-interoperability-only',
  archived,active,realData:false,platformVaultTested:false,twoTabsTested:false,resetTested:false}));
