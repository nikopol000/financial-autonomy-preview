const assert=require('node:assert/strict');
const {createSession,addEntry,updateEntry,removeEntry,remaining,commitSession}=require('../src/reconciliation-session');
let s=createSession({checkId:'check',accountId:'ing',difference:5000});
assert.equal(remaining(s),5000);
s=addEntry(s,{id:'income',effect:10000,kind:'income'});
assert.equal(remaining(s),-5000); // Crossing zero is valid.
s=addEntry(s,{id:'expense',effect:-5000,kind:'expense'});
assert.equal(remaining(s),0);
s=updateEntry(s,'expense',{effect:-4000,kind:'expense'});
assert.equal(remaining(s),-1000);
s=removeEntry(s,'expense');
assert.equal(remaining(s),-5000);
let persisted;commitSession(s,entries=>{persisted=entries});
assert.equal(persisted[0].reconciliationCheckId,'check');
assert.equal(persisted.length,1);
console.log('PASS draft reconciliation sessions');
