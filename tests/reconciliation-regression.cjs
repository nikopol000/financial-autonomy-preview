// Regression tests for the published reconciliation engine, using the actual bundle module.
// Run: node tests/reconciliation-regression.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html','utf8');
const activeVersion = html.match(/<meta name="financial-autonomy-version" content="([^"]+)"/)?.[1];
assert.match(activeVersion || '', /^18\.(?:2[0-9]|[3-9][0-9])$/, 'Unknown active release');
// v18.23-v18.25 are visual-only releases branched from the original reconciliation engine.
// The v18.22 correction is reintroduced in v18.26; do not silently assume it was present in v18.23-v18.25.
const hasNewReconciliation = activeVersion === '18.22' || Number(activeVersion.split('.')[1]) >= 26;
const bundlePath = html.match(/<script src="\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundlePath, 'Versioned bundle path missing');
const source = fs.readFileSync(bundlePath.replace(/^financial-autonomy-preview\//, ''),'utf8');
const start = source.indexOf('__d(function(g,r,i,_a,m,_e,_d){"use strict";Object.defineProperty(_e,\'__esModule\',{value:!0}),Object.defineProperty(_e,"comparePoint"');
assert.ok(start >= 0, 'Reconciliation module missing');
const end = source.indexOf('},207,[]);',start);
assert.ok(end > start, 'Reconciliation module terminator missing');
const factory = vm.runInNewContext('('+source.slice(start+4,end+1)+')');
const api = {};
factory({},()=>{},()=>{},null,{},api,{});
const date = '2026-10-13';
const base = () => ({started:'2026-10-01',accounts:[{id:'ing',name:'ING',kind:'current',date:'2026-10-01',opening:10000}],debts:[],transactions:[],incomes:[],expenses:[],recurring:[],goals:[],plans:[],audit:[],balanceChecks:[],checkAudit:[]});
const txn = (id,kind,amount,day,order,extra={}) => ({id,kind,amount,date:day,order,accountId:'ing',...extra});
const check = (id,observed,day,order) => ({id,accountId:'ing',observed,date:day,order});
function test(name,fn){try{fn();console.log('PASS',name)}catch(e){console.error('FAIL',name,e.message);process.exitCode=1}}
test('Income and expense after balance check change current balance',()=>{
 const s=base();s.balanceChecks=[check('c1',15000,date,1000)];s.transactions=[txn('e1','expense',5000,'2026-10-14',1000),txn('i1','income',10000,'2026-10-14',2000)];
 assert.equal(api.checkedBalance(s,'ing','2026-10-14'),20000);
});
test('Retroactive income and expense offset without changing confirmed balance',()=>{
 const s=base();s.balanceChecks=[check('c1',15000,date,3000)];s.transactions=[txn('e1','expense',5000,date,1000),txn('i1','income',10000,date,2000)];
 assert.equal(api.checkedBalance(s,'ing',date),15000);
 assert.equal(api.checkRows(s,'ing').at(-1).difference,0);
});
if (hasNewReconciliation) test('New verification replaces current unexplained difference',()=>{
 const s=base();s.balanceChecks=[check('wrong',0,'2026-10-12',1000),check('correct',12300,date,1000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows.length,2);
 assert.equal(api.checkedBalance(s,'ing',date),12300);
 assert.equal(rows.at(-1).difference,12300);
});
test('Multiple explanation directions should reconcile a +50 difference',()=>{
 const s=base();s.balanceChecks=[check('c1',15000,date,3000)];s.transactions=[txn('i1','income',10000,date,1000,{reconciliationCheckId:'c1'}),txn('e1','expense',5000,date,2000,{reconciliationCheckId:'c1'})];
 assert.equal(api.checkRows(s,'ing').at(-1).difference,0);
 assert.equal(api.checkedBalance(s,'ing',date),15000);
});

if (hasNewReconciliation) test('New check compares against last confirmed balance plus intervening transactions',()=>{
 const s=base();
 s.balanceChecks=[check('first',9000,'2026-10-12',1000),check('second',9100,date,2000)];
 s.transactions=[txn('spent','expense',500,date,1000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[1].expected,8500);
 assert.equal(rows[1].difference,600);
 assert.equal(api.checkedBalance(s,'ing',date),9100);
});

if (!hasNewReconciliation) console.log('PASS: v18.22-only cases run against the candidate in tests/reconciliation-v1822-candidate.cjs; active v' + activeVersion + ' remains unmodified');


if (hasNewReconciliation) test('Successive downward checks replace prior discrepancy, not accumulate it',()=>{
 const s=base();s.balanceChecks=[check('first',9000,'2026-10-12',1000),check('second',8500,date,1000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[0].difference,-1000);
 assert.equal(rows[1].expected,9000);
 assert.equal(rows[1].difference,-500);
 assert.equal(api.checkedBalance(s,'ing',date),8500);
});
if (hasNewReconciliation) test('A zero observed balance is a real checkpoint, not a missing value',()=>{
 const s=base();s.balanceChecks=[check('zero',0,'2026-10-12',1000),check('next',3000,date,1000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[1].expected,0);
 assert.equal(rows[1].difference,3000);
 assert.equal(api.checkedBalance(s,'ing',date),3000);
});
if (hasNewReconciliation) test('A same-day transaction between two checks affects only the later expectation',()=>{
 const s=base();s.balanceChecks=[check('first',9000,date,1000),check('second',9500,date,3000)];
 s.transactions=[txn('income','income',500,date,2000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[0].expected,10000);
 assert.equal(rows[1].expected,9500);
 assert.equal(rows[1].difference,0);
 assert.equal(api.checkedBalance(s,'ing',date),9500);
});
if (hasNewReconciliation) test('Signed multi-row explanation can offset a negative discrepancy without double counting',()=>{
 const s=base();s.balanceChecks=[check('c1',9500,date,3000)];
 s.transactions=[txn('e1','expense',700,date,1000,{reconciliationCheckId:'c1'}),txn('i1','income',200,date,2000,{reconciliationCheckId:'c1'})];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[0].expected,9500);
 assert.equal(rows[0].difference,0);
 assert.equal(api.checkedBalance(s,'ing',date),9500);
});
