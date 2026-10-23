'use strict';
const { inspectDemoEligibility } = require('./demo-eligibility.cjs');
const clone = value => JSON.parse(JSON.stringify(value));

// Pure synthetic seed: never accepts or reads a real ledger.
function makeDemoState({emptyState,saveTransaction,validateState,date='2026-10-23'}) {
  if (typeof emptyState!=='function'||typeof saveTransaction!=='function'||typeof validateState!=='function'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) throw Error('Demo engine or date invalid.');
  let state=emptyState(date);
  state.accounts=[
    {id:'demo-current',name:'Cont curent · DEMO',kind:'current',date,opening:350000},
    {id:'demo-savings',name:'Economii · DEMO',kind:'savings',date,opening:120000}
  ];
  for(const row of [
    {id:'demo-income',name:'Venit exemplu · DEMO',kind:'income',amount:250000,financialRole:'income'},
    {id:'demo-rent',name:'Chirie exemplu · DEMO',kind:'expense',amount:120000,financialRole:'unbudgeted'},
    {id:'demo-food',name:'Cumpărături exemplu · DEMO',kind:'expense',amount:35000,financialRole:'unbudgeted'}
  ]) state=saveTransaction(state,{...row,date,accountId:'demo-current',details:[]},date);
  validateState(state);
  return clone(state);
}

// No storage write API is passed into the session. Exports are explicitly denied.
// Storage is re-inspected before each read/update; concurrent real data invalidates demo.
function createDemoSession({storage,initialState,validateState,eligibility=inspectDemoEligibility}) {
  if(typeof validateState!=='function'||typeof eligibility!=='function')throw Error('Demo validation unavailable.');
  if(eligibility(storage)?.eligible!==true)throw Error('Demo unavailable: existing or inaccessible local data.');
  validateState(initialState);
  let state=clone(initialState),mode='demo';
  function active(){
    if(mode!=='demo')throw Error('Demo session has ended.');
    if(eligibility(storage)?.eligible!==true){
      state=null;mode='blocked';
      throw Error('Local data appeared or storage became inaccessible; demo discarded.');
    }
  }
  return Object.freeze({
    get mode(){return mode;},
    read(){active();return clone(state);},
    update(next){active();validateState(next);state=clone(next);return clone(state);},
    exportBackup(){throw Error('Demo data cannot be backed up or exported.');},
    exportDiagnostic(){throw Error('Demo data cannot be backed up or exported.');},
    exit(){state=null;if(mode==='demo')mode='exited';},
    startReal({confirmed}={}){
      if(mode!=='exited'||confirmed!==true)throw Error('Discard demo and explicitly confirm real mode first.');
      mode='real';
      return Object.freeze({mode:'real',reloadRealVault:true});
    }
  });
}
module.exports={makeDemoState,createDemoSession};
