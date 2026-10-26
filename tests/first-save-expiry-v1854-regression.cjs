'use strict';
// Immutable WEB 18.54 diff guard: no financial formulas, vault format or reset protocol changed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const previous=fs.readFileSync('_expo/static/js/web/index-v01853-vault-clarity-20261026.js','utf8');
const current=fs.readFileSync('_expo/static/js/web/index-v01854-first-save-expiry-20261026.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const changes=[["let faPendingFirstSave=null;\nconst FA_FIRST_RETRY_MS=120000;\nfunction faDropFirstSave(){faPendingFirstSave=null}\nfunction faRetryLive(){return !!faPendingFirstSave&&!faPendingFirstSave.used&&Date.now()<faPendingFirstSave.expiresAt}","let faPendingFirstSave=null,faFirstSaveExpiryTimer=null;\nconst FA_FIRST_RETRY_MS=120000;\n/* A first-save retry retains an AES key and authenticated ciphertext in memory.\n   Expiry must RELEASE that reference, not merely disable the retry button. */\nfunction faDropFirstSave(){\n  if(faPendingFirstSave){\n    faPendingFirstSave.used=true;\n    faPendingFirstSave.key=null;\n    faPendingFirstSave.payload=null;\n    faPendingFirstSave=null;\n  }\n  if(faFirstSaveExpiryTimer!==null){\n    clearTimeout(faFirstSaveExpiryTimer);\n    faFirstSaveExpiryTimer=null;\n  }\n}\nfunction faRetryLive(){\n  if(faPendingFirstSave&&Date.now()>=faPendingFirstSave.expiresAt)faDropFirstSave();\n  return !!faPendingFirstSave&&!faPendingFirstSave.used;\n}\nfunction faHoldFirstSave(prepared,reset){\n  faDropFirstSave();\n  const token={...prepared,reset,expiresAt:Date.now()+FA_FIRST_RETRY_MS,used:false};\n  faPendingFirstSave=token;\n  faFirstSaveExpiryTimer=setTimeout(()=>{if(faPendingFirstSave===token)faDropFirstSave()},FA_FIRST_RETRY_MS);\n  // Node/VM regression runs must not stay alive for two minutes per fault.\n  faFirstSaveExpiryTimer?.unref?.();\n}"],["faPendingFirstSave={...prepared,reset:before.reset,expiresAt:Date.now()+FA_FIRST_RETRY_MS,used:false};","faHoldFirstSave(prepared,before.reset);"],["version:\"18.53\"","version:\"18.54\""],["financial-autonomy-diagnostic-unic-v18.53.json","financial-autonomy-diagnostic-unic-v18.54.json"]];
let expected=previous;
for(const [before,after] of changes){
  assert.equal(expected.split(before).length-1,1,'Expected exactly one occurrence of old fragment');
  expected=expected.replace(before,after);
}
assert.equal(current,expected,'WEB 18.54 must change ONLY first-save token expiry and diagnostic version');
assert.match(html,/<meta name="financial-autonomy-version" content="18\.54"/);
assert.match(html,/index-v01854-first-save-expiry-20261026\.js\?build=18\.54\.1/);
assert.match(current,/financial-autonomy-diagnostic-unic-v18\.54\.json/);
console.log('PASS immutable WEB 18.54 first-save token-expiry diff and synchronized release metadata');
