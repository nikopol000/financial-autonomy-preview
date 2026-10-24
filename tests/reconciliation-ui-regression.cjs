'use strict';
// UI wiring tests for the ACTUAL deployed bundle module, with synthetic ledger
// and simulated React Native primitives. Financial formulas remain covered by
// reconciliation-batch-regression.cjs against the real bundle engine.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html','utf8');
const bundle = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(bundle,'Active bundle missing');
const source = fs.readFileSync(bundle,'utf8');
const begin = source.indexOf('function buildReconciliationBatch(');
const end = source.indexOf('function P(){',begin);
assert.ok(begin > 0 && end > begin,'Reconciliation editor not embedded in active UI');
const snippet = source.slice(begin,end);
const batch = fs.readFileSync('src/reconciliation-batch.cjs','utf8');
const draft = fs.readFileSync('src/reconciliation-draft.cjs','utf8');
assert.ok(snippet.includes(batch.slice(batch.indexOf('function buildReconciliationBatch('),batch.indexOf('module.exports ='))),'Bundle batch engine diverged from tested source');
assert.ok(snippet.includes(draft.slice(draft.indexOf('function createReconciliationDraft('),draft.indexOf('module.exports ='))),'Bundle draft controller diverged from tested source');
assert.match(source, /onExplainDifference:\(id,kind,expenseType\)=>/);
assert.match(source, /"Explică"===I&&Q&&\(0,k\.jsx\)\(FAReconciliationEditor/);
assert.match(snippet, /const current=await R\.peek\(\)/);
assert.match(snippet, /const snapshot=controller\.prepare\(current\)/);
assert.match(snippet, /await onSave\(snapshot\)/);

function fixture(options={}) {
  let counter=0, writes=0, persisted=null, ended=null, failSave=false;
  const state={started:'2026-10-01',accounts:[{id:'ing',name:'ING',kind:'current',opening:10000}],
    balanceChecks:[{id:'c1',accountId:'ing',date:'2026-10-13',observed:9500,order:3000}],
    transactions:[],debts:[],incomes:[],expenses:[],recurring:[],goals:[],plans:[]};
  let loadState=JSON.parse(JSON.stringify(state));
  const engine={
    saveTransaction:(s,row)=>({...s,transactions:[...s.transactions,row]}),
    checkRows:(s,accountId)=>s.balanceChecks.filter(c=>c.accountId===accountId).map(c=>{
      const total=s.transactions.filter(t=>t.accountId===accountId&&!t.voided)
        .reduce((sum,t)=>sum+(t.kind==='income'?t.amount:-t.amount),s.accounts.find(a=>a.id===accountId).opening);
      return {...c,difference:c.observed-total};
    }),
    checkedBalance:(s,accountId,date)=>s.balanceChecks.find(c=>c.accountId===accountId&&c.date===date).observed
  };
  const Button=function Button(){}, Field=function Field(){};
  const ui={h2:{},body:{},note:{},eyebrow:{},h1:{},banner:{},item:{},error:{}};
  const h={useUI:()=>({u:ui,colors:{}}),Button,Field,fmt:n=>(n/100).toFixed(2)};
  const k={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const t={useState:init=>{
    const at=hookIndex++;
    if(!(at in hooks))hooks[at]=typeof init==='function'?init():init;
    return [hooks[at],value=>{hooks[at]=typeof value==='function'?value(hooks[at]):value}];
  }};
  const d={default:'View'},o={default:'Text'},x={today:()=> '2026-10-23',money:value=>{
    const n=Number(String(value).replace(',','.'));
    if(!Number.isFinite(n))throw Error('Invalid money');
    return Math.round(n*100);
  }};
  const y={saveTransaction:engine.saveTransaction},faRec={checkRows:engine.checkRows,checkedBalance:engine.checkedBalance};
  const R={peek:async()=>JSON.parse(JSON.stringify(loadState))};
  const globals={crypto:{randomUUID:()=> 'test-id-'+(++counter)}};
  const make = new Function('t','h','k','d','o','x','y','faRec','R','globalThis',
    snippet+'; return FAReconciliationEditor;');
  const Component=make(t,h,k,d,o,x,y,faRec,R,globals);
  const hooks=[];let hookIndex=0,tree;
  const props={s:state,checkId:'c1',initialKind:'expense',onSave:async snapshot=>{
    writes++;if(failSave)throw Error('Simulated encrypted storage failure');
    persisted=JSON.parse(JSON.stringify(snapshot));
  },onEnd:(ok,attempted)=>{ended={ok,attempted}}};
  function render(){hookIndex=0;tree=Component(props);return tree}
  function walk(node){if(Array.isArray(node))return node.flatMap(walk);if(!node||typeof node!=='object')return [];
    return [node,...walk(node.props?.children)];}
  function button(label){const found=walk(tree).find(n=>n.type===Button&&n.props.label===label);
    assert.ok(found,'Missing button: '+label);return found.props;}
  function field(label){const found=walk(tree).find(n=>n.type===Field&&n.props.label===label);
    assert.ok(found,'Missing field: '+label);return found.props;}
  function input(name,value){field(name).onChange(value);render()}
  function press(label){const b=button(label);assert.notEqual(b.disabled,true,'Button disabled: '+label);return b.onPress()}
  function add(kind,name,amount){if(kind==='income'){press('Venit');render()}
    input('Descriere',name);input('Sumă (RON)',String(amount));press('+ Adaugă operațiunea');render();}
  render();
  return {render,button,field,input,press,add,state,ledger:()=>loadState,
    replaceLoaded:v=>{loadState=v},get writes(){return writes},get persisted(){return persisted},
    get ended(){return ended},fail:()=>{failSave=true}};
}
async function main(){
  let passed=0;
  async function test(name,fn){try{await fn();passed++;console.log('PASS',name)}
    catch(err){console.error('FAIL',name,err.stack||err.message);process.exitCode=1}}
  await test('Bundle includes real source contract and UI wiring',()=>{assert.match(snippet,/function FAReconciliationEditor/);});
  await test('Two opposite-sign rows commit one complete snapshot without double-counting',async()=>{
    const f=fixture();f.add('expense','Plată',7); // 700 bani
    f.add('income','Rambursare',2); // 200 bani
    assert.equal(f.button('Salvează toate operațiunile').disabled,false);
    await f.press('Salvează toate operațiunile');f.render();
    assert.equal(f.writes,1);assert.equal(f.persisted.transactions.length,2);
    assert.equal(f.persisted.transactions[0].amount,700);
    assert.equal(f.persisted.transactions[1].amount,200);
    assert.equal(f.state.transactions.length,0);assert.equal(f.ended.ok,true);
  });
  await test('Cancel never writes to encrypted vault',()=>{
    const f=fixture();f.add('expense','Plată',7);f.press('Anulează fără salvare');
    assert.equal(f.writes,0);assert.equal(f.ended.ok,false);assert.equal(f.ended.attempted,false);
  });
  await test('Edit and remove preserve partial draft and block incomplete save',()=>{
    const f=fixture();f.add('expense','Plată',7);f.add('income','Rambursare',2);
    f.press('Modifică');f.render();f.input('Sumă (RON)','6');
    f.press('Aplică modificarea');f.render();
    assert.equal(f.button('Salvează toate operațiunile').disabled,true);
    f.press('Elimină');f.render();assert.equal(f.button('Salvează toate operațiunile').disabled,true);
    assert.equal(f.writes,0);
  });
  await test('Changed encrypted ledger rejects save without any write',async()=>{
    const f=fixture();f.add('expense','Plată',7);f.add('income','Rambursare',2);
    const changed=JSON.parse(JSON.stringify(f.ledger()));changed.transactions.push({id:'external'});
    f.replaceLoaded(changed);await f.press('Salvează toate operațiunile');f.render();
    assert.equal(f.writes,0);assert.equal(f.ended,null);
  });
  await test('Failed persistence keeps screen renderable and disallows duplicate retry',async()=>{
    const f=fixture();f.add('expense','Plată',7);f.add('income','Rambursare',2);
    f.fail();await f.press('Salvează toate operațiunile');f.render();
    assert.equal(f.writes,1);assert.equal(f.button('Salvează toate operațiunile').disabled,true);
    f.press('Închide reconcilierea');assert.equal(f.ended.ok,false);assert.equal(f.ended.attempted,true);
  });
  console.log(passed+'/6 reconciliation UI tests passed');
  if(passed!==6)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
