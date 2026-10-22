// Candidate-only regression; v18.21 remains active until release gates pass.
// Run: node tests/reconciliation-v1822-candidate.cjs
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {candidate} = require('../scripts/prepare-v1822.cjs');
const source = candidate();
const start = source.indexOf('__d(function(g,r,i,_a,m,_e,_d){"use strict";Object.defineProperty(_e,\'__esModule\',{value:!0}),Object.defineProperty(_e,"comparePoint"');
assert.ok(start >= 0, 'Reconciliation module missing');
const end = source.indexOf('},207,[]);', start);
assert.ok(end > start, 'Reconciliation module terminator missing');
const factory = vm.runInNewContext('('+source.slice(start+4,end+1)+')');
const api = {};
factory({},()=>{},()=>{},null,{},api,{});
const date = '2026-10-13';
const base = () => ({started:'2026-10-01',accounts:[{id:'ing',name:'ING',kind:'current',date:'2026-10-01',opening:10000}],debts:[],transactions:[],incomes:[],expenses:[],recurring:[],goals:[],plans:[],audit:[],balanceChecks:[],checkAudit:[]});
const txn = (id,kind,amount,day,order,extra={}) => ({id,kind,amount,date:day,order,accountId:'ing',...extra});
const check = (id,observed,day,order) => ({id,accountId:'ing',observed,date:day,order});
function test(name,fn){fn();console.log('PASS candidate:',name)}
test('income and expense after check',()=>{
 const s=base();s.balanceChecks=[check('c1',15000,date,1000)];s.transactions=[txn('e','expense',5000,'2026-10-14',1000),txn('i','income',10000,'2026-10-14',2000)];
 assert.equal(api.checkedBalance(s,'ing','2026-10-14'),20000);
});
test('retroactive income and expense',()=>{
 const s=base();s.balanceChecks=[check('c1',15000,date,3000)];s.transactions=[txn('e','expense',5000,date,1000),txn('i','income',10000,date,2000)];
 assert.equal(api.checkRows(s,'ing').at(-1).difference,0);
});
test('correction of erroneous zero balance',()=>{
 const s=base();s.balanceChecks=[check('wrong',0,'2026-10-12',1000),check('correct',12300,date,1000)];
 assert.equal(api.checkedBalance(s,'ing',date),12300);
 assert.equal(api.checkRows(s,'ing').at(-1).difference,12300);
});
test('multiple explanations reconcile',()=>{
 const s=base();s.balanceChecks=[check('c1',15000,date,3000)];s.transactions=[txn('i','income',10000,date,1000,{reconciliationCheckId:'c1'}),txn('e','expense',5000,date,2000,{reconciliationCheckId:'c1'})];
 assert.equal(api.checkRows(s,'ing').at(-1).difference,0);
});
test('consecutive checks account for intervening expense',()=>{
 const s=base();s.balanceChecks=[check('first',9000,'2026-10-12',1000),check('second',9100,date,2000)];s.transactions=[txn('spent','expense',500,date,1000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[1].expected,8500);assert.equal(rows[1].difference,600);
});

test('consecutive checks without transactions compare to prior observed balance',()=>{
 const s=base();s.balanceChecks=[check('first',9000,'2026-10-12',1000),check('second',9100,date,2000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[1].expected,9000);
 assert.equal(rows[1].difference,100);
 assert.equal(api.checkedBalance(s,'ing',date),9100);
});
test('second verification with matching intervening expense has zero unexplained difference',()=>{
 const s=base();s.balanceChecks=[check('first',9000,'2026-10-12',1000),check('second',8500,date,2000)];
 s.transactions=[txn('spent','expense',500,date,1000)];
 const rows=api.checkRows(s,'ing');
 assert.equal(rows[1].expected,8500);
 assert.equal(rows[1].difference,0);
 assert.equal(api.checkedBalance(s,'ing',date),8500);
});
