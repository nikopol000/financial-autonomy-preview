'use strict';
// #4/#29/#35 RESEARCH ONLY. Disposable Chromium origin and synthetic state.
// One IndexedDB transaction atomically stores KEY/PAYLOAD/authority and an
// operation-specific witness. NOT production, anti-rollback, or a recovery UI.
const assert=require('node:assert/strict');
const http=require('node:http');
const {chromium}=require('playwright');
async function install(page){
  await page.evaluate(()=>{
    const DB='fa.restore.operation.research',VAULT='vault',OPS='operations';
    const enc=new TextEncoder(),dec=new TextDecoder();
    const hex=a=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
    const bytes=s=>new Uint8Array(s.match(/../g).map(x=>parseInt(x,16)));
    const digest=async s=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
    const open=()=>new Promise((resolve,reject)=>{
      const q=indexedDB.open(DB,1);
      q.onupgradeneeded=()=>{q.result.createObjectStore(VAULT);q.result.createObjectStore(OPS)};
      q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
    });
    const read=async opId=>{
      const db=await open();
      try{return await new Promise((resolve,reject)=>{
        const tx=db.transaction([VAULT,OPS],'readonly');let current=null,witness=null;
        tx.objectStore(VAULT).get('current').onsuccess=e=>current=e.target.result??null;
        tx.objectStore(OPS).get(opId).onsuccess=e=>witness=e.target.result??null;
        tx.oncomplete=()=>resolve({current,witness});
        tx.onabort=()=>reject(tx.error??Error('READ_ABORT'));
      });}finally{db.close()}
    };
    const authenticate=async raw=>{
      if(!raw||raw.schema!==2||!Number.isSafeInteger(raw.revision)||raw.revision<1||
        typeof raw.key!=='string'||raw.key.length!==64||typeof raw.opId!=='string')
        throw Error('INVALID_AUTHORITY');
      const key=await crypto.subtle.importKey('raw',bytes(raw.key),'AES-GCM',false,['decrypt']);
      const plain=JSON.parse(dec.decode(await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:bytes(raw.iv)},key,bytes(raw.cipher))));
      if(plain.opId!==raw.opId||plain.revision!==raw.revision||plain.schema!==2)
        throw Error('AUTHORITY_BINDING_MISMATCH');
      return plain;
    };
    const api=window.__restoreOperationResearch={};
    api.read=read;
    api.ack=async({before,opId,expected})=>{
      try{
        const {current,witness}=await read(opId);
        if(JSON.stringify(current)===JSON.stringify(before))return 'verified_unchanged';
        if(!current||current.opId!==opId||!witness||witness.opId!==opId||
          witness.revision!==current.revision||
          witness.digest!==await digest(JSON.stringify(current)))return 'unknown';
        const plain=await authenticate(current);
        return JSON.stringify(plain.state)===JSON.stringify(expected)
          ?'verified_committed_operation':'unknown';
      }catch{return 'unknown'}
    };
    api.commit=async({opId,state,expectedRevision,allowInitialize=false,fault=null})=>{
      if(typeof opId!=='string'||!/^op-[a-z0-9-]{4,}$/.test(opId))
        return {ok:false,reason:'invalid-operation-id'};
      const before=(await read(opId)).current;
      if(!before&&(!allowInitialize||expectedRevision!==0))
        return {ok:false,reason:'missing-authority'};
      if(before){
        try{await authenticate(before)}catch{return {ok:false,reason:'invalid-authority'}}
        if(before.revision!==expectedRevision)
          return {ok:false,reason:'stale-revision'};
      }
      const keyBytes=before?bytes(before.key):crypto.getRandomValues(new Uint8Array(32));
      const key=await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt']);
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const revision=expectedRevision+1;
      const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,
        enc.encode(JSON.stringify({schema:2,revision,opId,state}))));
      const next={schema:2,revision,opId,key:hex(keyBytes),iv:hex(iv),cipher:hex(cipher)};
      const witness={opId,revision,digest:await digest(JSON.stringify(next))};
      const db=await open();let result;
      try{result=await new Promise((resolve,reject)=>{
        const tx=db.transaction([VAULT,OPS],'readwrite');
        const v=tx.objectStore(VAULT),o=tx.objectStore(OPS);
        let gotVault=false,gotOp=false,current=null,priorOp=null,reason=null;
        const abort=why=>{reason=why;tx.abort()};
        const stage=()=>{
          if(!gotVault||!gotOp)return;
          if(JSON.stringify(current)!==JSON.stringify(before))return abort('authority-changed');
          if(priorOp!==null)return abort('duplicate-operation-id');
          if(fault==='before-put')return abort('injected-before-put');
          v.put(next,'current');o.put(witness,opId);
          if(fault==='after-put')return abort('injected-after-put');
        };
        v.get('current').onsuccess=e=>{current=e.target.result??null;gotVault=true;stage()};
        o.get(opId).onsuccess=e=>{priorOp=e.target.result??null;gotOp=true;stage()};
        tx.oncomplete=()=>resolve({ok:true,revision});
        tx.onabort=()=>resolve({ok:false,reason:reason??'transaction-aborted'});
        tx.onerror=()=>{if(tx.error)reject(tx.error)};
      });}finally{db.close()}
      if(result.ok&&fault==='throw-after-complete')throw Error('SYNTHETIC_POST_COMMIT_ERROR');
      return result;
    };
    api.deleteWitnessForTest=async opId=>{
      const db=await open();
      try{await new Promise((resolve,reject)=>{
        const tx=db.transaction(OPS,'readwrite');tx.objectStore(OPS).delete(opId);
        tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });}finally{db.close()}
    };
  });
}
async function main(){
  const server=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});
    res.end('<!doctype html><title>synthetic restore operation witness</title>')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    const options={headless:true,args:['--no-sandbox']};
    if(process.env.FA_CHROMIUM_EXECUTABLE)options.executablePath=process.env.FA_CHROMIUM_EXECUTABLE;
    browser=await chromium.launch(options);
    const context=await browser.newContext(),url='http://127.0.0.1:'+server.address().port+'/';
    try{
      const a=await context.newPage(),b=await context.newPage();
      await Promise.all([a.goto(url),b.goto(url)]);
      await Promise.all([install(a),install(b)]);
      const first=await a.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-initialize-0001',state:{transactions:['A']},expectedRevision:0,allowInitialize:true}));
      assert.equal(first.ok,true);
      assert.equal(await b.evaluate(()=>window.__restoreOperationResearch.ack({
        before:null,opId:'op-initialize-0001',expected:{transactions:['A']}})),
      'verified_committed_operation');
      console.log('PASS atomic IDB restore witness: key, ciphertext, authority and authenticated operation committed together');
      const prior=(await a.evaluate(()=>window.__restoreOperationResearch.read('op-initialize-0001'))).current;
      for(const fault of ['before-put','after-put']){
        const opId='op-abort-'+fault;
        const attempt=await a.evaluate(({opId,fault})=>window.__restoreOperationResearch.commit({
          opId,state:{transactions:['A','B']},expectedRevision:1,fault}),{opId,fault});
        assert.equal(attempt.ok,false);
        assert.equal(await b.evaluate(({prior,opId})=>window.__restoreOperationResearch.ack({
          before:prior,opId,expected:{transactions:['A','B']}}),{prior,opId}),
        'verified_unchanged');
        assert.deepEqual((await b.evaluate(opId=>window.__restoreOperationResearch.read(opId),opId)).current,prior);
      }
      console.log('PASS atomic IDB restore witness: aborted writes never strand a key, payload or operation witness');
      await assert.rejects(a.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-restore-0002',state:{transactions:['A','B']},expectedRevision:1,
        fault:'throw-after-complete'})),/SYNTHETIC_POST_COMMIT_ERROR/);
      await b.reload();await install(b);
      assert.equal(await b.evaluate(()=>window.__restoreOperationResearch.ack({
        before:null,opId:'op-restore-0002',expected:{transactions:['A','B']}})),
      'verified_committed_operation');
      console.log('PASS atomic IDB restore witness: post-commit exception acknowledged after reload without replay');
      const second=(await b.evaluate(()=>window.__restoreOperationResearch.read('op-restore-0002'))).current;
      const duplicate=await b.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-restore-0002',state:{transactions:['X']},expectedRevision:2}));
      assert.equal(duplicate.ok,false);
      assert.deepEqual((await b.evaluate(()=>window.__restoreOperationResearch.read('op-restore-0002'))).current,second);
      console.log('PASS atomic IDB restore witness: duplicate operation ID cannot overwrite current ledger');
      const third=await a.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-next-0003',state:{transactions:['A','B','C']},expectedRevision:2}));
      assert.equal(third.ok,true);
      const stale=await b.evaluate(()=>window.__restoreOperationResearch.commit({
        opId:'op-stale-0004',state:{transactions:['A','B','D']},expectedRevision:2}));
      assert.equal(stale.ok,false);
      assert.equal(await b.evaluate(({second})=>window.__restoreOperationResearch.ack({
        before:second,opId:'op-stale-0004',expected:{transactions:['A','B','D']}}),{second}),
      'unknown');
      console.log('PASS atomic IDB restore witness: stale tab rejected, conflicting outcome unknown and never replayed');
      // Competing tabs use the same previously authenticated revision. IDB must
      // serialize both the authority CAS and the witness put, not merely the
      // asynchronous preflight. Synthetic records only; no production migration.
      const beforeRace=(await a.evaluate(()=>window.__restoreOperationResearch.read('op-next-0003'))).current;
      const candidates=[
        {opId:'op-race-left-0005',state:{transactions:['A','B','C','left']}},
        {opId:'op-race-right-0006',state:{transactions:['A','B','C','right']}}
      ];
      const raced=await Promise.all([
        a.evaluate(candidate=>window.__restoreOperationResearch.commit({...candidate,expectedRevision:3}),candidates[0]),
        b.evaluate(candidate=>window.__restoreOperationResearch.commit({...candidate,expectedRevision:3}),candidates[1])
      ]);
      assert.equal(raced.filter(result=>result.ok).length,1,'exactly one distinct-ID writer must win');
      const winnerIndex=raced.findIndex(result=>result.ok);
      const winner=candidates[winnerIndex],loser=candidates[1-winnerIndex];
      const afterRace=(await a.evaluate(opId=>window.__restoreOperationResearch.read(opId),winner.opId)).current;
      assert.equal(afterRace.revision,4);
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:beforeRace,opId:winner.opId,expected:winner.state}),
      'verified_committed_operation');
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:beforeRace,opId:loser.opId,expected:loser.state}),
      'unknown');
      console.log('PASS atomic IDB restore witness: two simultaneous distinct-ID writers serialize, one wins without torn witness');
      const sharedId='op-race-shared-0007';
      const sharedStates=[
        {transactions:['A','B','C','shared-left']},
        {transactions:['A','B','C','shared-right']}
      ];
      const shared=await Promise.all([
        a.evaluate(({opId,state})=>window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:4}),{opId:sharedId,state:sharedStates[0]}),
        b.evaluate(({opId,state})=>window.__restoreOperationResearch.commit({
          opId,state,expectedRevision:4}),{opId:sharedId,state:sharedStates[1]})
      ]);
      assert.equal(shared.filter(result=>result.ok).length,1,'same-ID race must not double commit');
      const sharedWinner=sharedStates[shared.findIndex(result=>result.ok)];
      const sharedLoser=sharedStates[1-shared.findIndex(result=>result.ok)];
      const sharedRecord=(await a.evaluate(opId=>window.__restoreOperationResearch.read(opId),sharedId));
      assert.equal(sharedRecord.current.revision,5);
      assert.equal(sharedRecord.witness.opId,sharedId);
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:afterRace,opId:sharedId,expected:sharedWinner}),
      'verified_committed_operation');
      assert.equal(await b.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:afterRace,opId:sharedId,expected:sharedLoser}),
      'unknown','a shared operation ID cannot authenticate the losing state');
      console.log('PASS atomic IDB restore witness: simultaneous duplicate operation IDs cannot double commit');
      await a.evaluate(opId=>window.__restoreOperationResearch.deleteWitnessForTest(opId),sharedId);
      assert.equal(await a.evaluate(({before,opId,expected})=>window.__restoreOperationResearch.ack({
        before,opId,expected}),{before:afterRace,opId:sharedId,expected:sharedWinner}),'unknown');
      console.log('PASS atomic IDB restore witness: missing operation witness quarantines without repairing/deleting');
    }finally{await context.close()}
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1});
