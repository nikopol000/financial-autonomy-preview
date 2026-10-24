'use strict';
// Exercise the actual active WEB bundle's Editor handlers using synthetic state.
// No browser or real user storage is accessed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html','utf8');
const path = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(path, 'Active WEB bundle missing');
const source = fs.readFileSync(path,'utf8');
const recAt=source.indexOf('Object.defineProperty(_e,"comparePoint"');
const recStart=source.lastIndexOf('__d(function(',recAt);
const recEnd=source.indexOf('},207,[]);',recAt);
assert.ok(recAt>=0&&recStart>=0&&recEnd>recStart,'Real financial balance engine module missing');
const rec={};
vm.runInNewContext('('+source.slice(recStart+4,recEnd+1)+')')({},()=>{},()=>{},null,{},rec,[]);
assert.equal(typeof rec.checkedBalance,'function');
const dateAt=source.indexOf('_e.validDate=r');
const dateStart=source.lastIndexOf('__d(function(',dateAt);
const dateEnd=source.indexOf('},204,[]);',dateAt);
assert.ok(dateAt>=0&&dateStart>=0&&dateEnd>dateStart,'Real date validator module missing');
const dateApi={};
vm.runInNewContext('('+source.slice(dateStart+4,dateEnd+1)+')')({},()=>{},()=>{},null,{},dateApi,[]);
assert.equal(typeof dateApi.validDate,'function');
assert.ok(source.includes('N&&(0,m.jsx)(t.default,{accessibilityRole:"alert"'),
  'Editor error state is not exposed as an accessible alert');
assert.ok(source.includes('secondary:!0,disabled:R,onPress:async()=>{if(R||!v)return;'),
  'Close/reopen control must be disabled while saving');
assert.ok(source.includes('label:"Salveaz\\u0103 corec\\u021bia",disabled:R,onPress:async()=>{if(R)return;'),
  'Opening correction control must be disabled while saving');

function extractHandler(needle) {
  const labelAt=source.indexOf(needle);
  assert.ok(labelAt>=0,'Missing Editor control: '+needle);
  const marker='onPress:async()=>{';
  const at=source.indexOf(marker,labelAt);
  assert.ok(at>=0&&at<labelAt+200,'Expected guarded async handler: '+needle);
  const firstBrace=source.indexOf('{',at);
  let depth=0,quote='',escaped=false;
  for(let i=firstBrace;i<source.length;i++) {
    const ch=source[i];
    if(quote) {
      if(escaped)escaped=false;
      else if(ch==='\\')escaped=true;
      else if(ch===quote)quote='';
      continue;
    }
    if(ch==='"'||ch==="'"||ch===String.fromCharCode(96)){quote=ch;continue}
    if(ch==='{')depth++;
    else if(ch==='}'&&--depth===0)
      return source.slice(at+'onPress:'.length,i+1);
  }
  throw Error('Unclosed handler: '+needle);
}

function fixture(needle,{fail=false,invalid=false,balance=0,kind='account',date='2026-10-24'}={}) {
  const account={id:'synthetic-account',name:'Synthetic account',opening:100,date:'2026-10-01'};
  const debt={id:'synthetic-debt',name:'Synthetic debt',amount:400,payment:50,kind:'loan',date:'2026-10-01'};
  const v=kind==='debt'?debt:account;
  const state={started:'2026-10-01',accounts:[account],debts:[debt],transactions:[],audit:[]};
  const d={accountBalance:()=>balance,debtBalance:()=>balance};
  const parse=()=>{if(invalid)throw Error('Invalid synthetic amount');return 200};
  const o={today:()=> '2026-10-24',validDate:dateApi.validDate,signedMoney:parse,money:parse};
  const Y={opening:'2',date};
  let error='',busy=false,closed=0,writes=0,attempted;
  const O=value=>{error=value};
  const I=value=>{busy=value};
  const b=async value=>{
    writes++;attempted=value;
    if(fail)throw Error('Registrul a fost modificat de altă filă.');
  };
  const h=()=>{closed++};
  const handler=new Function('v','x','e','d','o','O','b','h','R','I','Y',
    'return ('+extractHandler(needle)+')')
    (v,kind,state,d,o,O,b,h,false,I,Y);
  return {press:handler,initial:state,get error(){return error},get busy(){return busy},
    get closed(){return closed},get writes(){return writes},
    get attempted(){return attempted}};
}

const close='label:v?.closedAt?';
const correction='label:"Salveaz\\u0103 corec\\u021bia"';
let passed=0;
async function test(name,fn) {
  try{await fn();passed++;console.log('PASS',name)}
  catch(err){console.error('FAIL',name,err.stack||err);process.exitCode=1}
}
(async()=>{
  await test('Close-account stale save refusal displays error, never closes modal',async()=>{
    const f=fixture(close,{fail:true});await f.press();
    assert.match(f.error,/altă filă/);assert.equal(f.closed,0);
    assert.equal(f.writes,1);assert.equal(f.busy,false);
  });
  await test('Nonzero balance blocks account closure before any write',async()=>{
    const f=fixture(close,{balance:300});await f.press();
    assert.match(f.error,/soldul este zero/);assert.equal(f.closed,0);
    assert.equal(f.writes,0);assert.equal(f.busy,false);
  });
  await test('Successful account closure persists once before modal closes',async()=>{
    const f=fixture(close);await f.press();
    assert.equal(f.writes,1);assert.equal(f.closed,1);
    assert.equal(f.attempted.accounts[0].closedAt,'2026-10-24');
    assert.equal(f.busy,false);
  });
  await test('Opening correction stale save refusal displays error, never closes',async()=>{
    const f=fixture(correction,{fail:true});await f.press();
    assert.match(f.error,/altă filă/);assert.equal(f.closed,0);
    assert.equal(f.writes,1);assert.equal(f.busy,false);
  });
  await test('Invalid opening correction amount reports error without write',async()=>{
    const f=fixture(correction,{invalid:true});await f.press();
    assert.match(f.error,/Invalid synthetic amount/);assert.equal(f.closed,0);
    assert.equal(f.writes,0);assert.equal(f.busy,false);
  });
  await test('Successful opening correction persists once before modal closes',async()=>{
    const f=fixture(correction);await f.press();
    assert.equal(f.writes,1);assert.equal(f.closed,1);
    assert.equal(f.attempted.accounts[0].opening,200);
    assert.equal(f.busy,false);
  });
  await test('Debt opening correction prefills the actual principal, not nonexistent opening',async()=>{
    const expression=source.match(/onPress:\(\)=>\{w\(\{\.\.\.Y,opening:(.*?),date:v\.date,openingCorrection:"yes"\}\)\}/)?.[1];
    assert.ok(expression,'Debt correction prefill expression missing');
    const prefill=new Function('v','x','C','return '+expression);
    const C=value=>String((value||0)/100);
    assert.equal(prefill({amount:400},'debt',C),'4');
    assert.equal(prefill({opening:100},'account',C),'1');
  });
  await test('Debt correction changes only selected debt principal, preserves accounts and payment',async()=>{
    const f=fixture(correction,{kind:'debt'});await f.press();
    assert.equal(f.writes,1);assert.equal(f.closed,1);assert.equal(f.busy,false);
    assert.equal(f.attempted.debts[0].amount,200);
    assert.equal(f.attempted.debts[0].payment,50);
    assert.equal(f.attempted.debts[0].date,'2026-10-24');
    assert.equal(f.attempted.accounts[0].opening,100);
    assert.equal(f.attempted.accounts[0].date,'2026-10-01');
  });
  await test('Debt correction stale save refuses closure and exposes error',async()=>{
    const f=fixture(correction,{kind:'debt',fail:true});await f.press();
    assert.match(f.error,/altă filă/);assert.equal(f.closed,0);
    assert.equal(f.writes,1);assert.equal(f.busy,false);
  });
  await test('Invalid debt correction refuses persistence and leaves modal open',async()=>{
    const f=fixture(correction,{kind:'debt',invalid:true});await f.press();
    assert.match(f.error,/Invalid synthetic amount/);assert.equal(f.writes,0);
    assert.equal(f.closed,0);assert.equal(f.busy,false);
  });
  await test('Actual bundled balance engine uses corrected debt principal, not account money',async()=>{
    const f=fixture(correction,{kind:'debt'});
    assert.equal(rec.checkedBalance(f.initial,'synthetic-debt','2026-10-24'),400);
    assert.equal(rec.checkedBalance(f.initial,'synthetic-account','2026-10-24'),100);
    await f.press();
    assert.equal(rec.checkedBalance(f.attempted,'synthetic-debt','2026-10-24'),200);
    assert.equal(rec.checkedBalance(f.attempted,'synthetic-account','2026-10-24'),100);
    assert.equal(rec.checkedBalance(f.initial,'synthetic-debt','2026-10-24'),400);
  });
  for(const kind of ['account','debt']) {
    await test(kind+' opening correction rejects impossible calendar date before persistence',async()=>{
      const f=fixture(correction,{kind,date:'2026-02-30'});await f.press();
      assert.match(f.error,/Data soldului inițial/);
      assert.equal(f.writes,0);assert.equal(f.closed,0);assert.equal(f.busy,false);
    });
    await test(kind+' opening correction rejects date before ledger start',async()=>{
      const f=fixture(correction,{kind,date:'2026-09-30'});await f.press();
      assert.match(f.error,/perioada evidenței/);
      assert.equal(f.writes,0);assert.equal(f.closed,0);assert.equal(f.busy,false);
    });
    await test(kind+' opening correction rejects future date',async()=>{
      const f=fixture(correction,{kind,date:'2026-10-25'});await f.press();
      assert.match(f.error,/perioada evidenței/);
      assert.equal(f.writes,0);assert.equal(f.closed,0);assert.equal(f.busy,false);
    });
  }
  console.log(passed+'/17 Editor save-error regression tests passed');
  if(passed!==17)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
