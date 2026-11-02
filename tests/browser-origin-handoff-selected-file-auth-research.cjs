'use strict';
// P1 #4/#29/#35 H05/H06 — research-only, disposable Chromium origin.
// A user-selected File is read with the actual active WEB PBKDF2/AES-GCM module.
// NO production import, destination mutation, provenance or recency guarantee.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const PREFIX='/financial-autonomy-preview/';
const PASSWORD='Synthetic-H05-H06-Only-2026!';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
function serve(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  const relative=pathname==='/'||pathname===PREFIX?'index.html':
    pathname.startsWith(PREFIX)?pathname.slice(PREFIX.length):'';
  const absolute=path.resolve(ROOT,relative);
  if(!relative||(!absolute.startsWith(ROOT+path.sep)&&absolute!==path.join(ROOT,'index.html'))){
    res.writeHead(404);res.end();return;
  }
  fs.readFile(absolute,(error,bytes)=>{
    if(error){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(absolute)]||'application/octet-stream',
      'Cache-Control':'no-store'});
    res.end(bytes);
  });
}
const fixture=()=>{
  const date='2026-10-15';
  return {version:4,names:[],nameChanges:[],rolesEffectiveFrom:date,
    balanceChecks:[],checkAudit:[],currency:'RON',started:date,
    accounts:[{id:'h05-checking',name:'Cont sintetic',kind:'current',opening:50000,date}],
    incomes:[],expenses:[],debts:[],recurring:[],
    transactions:[{id:'h05-old-expense',name:'Operațiune veche sintetică',
      kind:'expense',accountId:'h05-checking',amount:1250,date,details:[]}],
    monthPlans:[{month:'2026-10',budgets:[],expenses:[],debtPayments:[],contribution:0}],
    goals:[],plans:[],reviews:{},audit:[]};
};
function authenticInvalidSchema(validEnvelope){
  const env=JSON.parse(validEnvelope);
  const salt=crypto.randomBytes(16),nonce=crypto.randomBytes(12);
  const key=crypto.pbkdf2Sync(PASSWORD.normalize('NFKC'),salt,600000,32,'sha256');
  const cipher=crypto.createCipheriv('aes-256-gcm',key,nonce);
  cipher.setAAD(Buffer.from('FinancialAutonomy/backup/1'));
  const invalid={...fixture(),accounts:'not-an-array'};
  const raw=Buffer.concat([cipher.update(JSON.stringify(invalid)),cipher.final(),cipher.getAuthTag()]);
  key.fill(0);
  return JSON.stringify({...env,salt:salt.toString('hex'),nonce:nonce.toString('hex'),
    data:raw.toString('hex')});
}
async function footprint(page){
  // Hash rather than log key/ciphertext values; compare the complete destination footprint.
  return page.evaluate(async()=>{
    const hash=async text=>Array.from(new Uint8Array(
      await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))))
      .map(x=>x.toString(16).padStart(2,'0')).join('');
    const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).sort();
    const entries=[];
    for(const name of keys){
      const value=localStorage.getItem(name);
      entries.push({name,length:value.length,digest:await hash(value)});
    }
    const databases=(await indexedDB.databases()).map(d=>({name:d.name,version:d.version}))
      .sort((a,b)=>a.name.localeCompare(b.name));
    return {entries,databases};
  });
}
async function selectAndInspect(page,{name,text,password,expectSuccess}){
  await page.locator('#h05-selected-file').setInputFiles({
    name,mimeType:'application/json',buffer:Buffer.from(text,'utf8')
  });
  const before=await footprint(page);
  const result=await page.evaluate(async password=>{
    const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,
      clear=Storage.prototype.clear,open=indexedDB.open,del=indexedDB.deleteDatabase;
    let writes=0;
    Storage.prototype.setItem=function(){writes++;throw Error('RESEARCH_WRITE_FORBIDDEN')};
    Storage.prototype.removeItem=function(){writes++;throw Error('RESEARCH_DELETE_FORBIDDEN')};
    Storage.prototype.clear=function(){writes++;throw Error('RESEARCH_CLEAR_FORBIDDEN')};
    indexedDB.open=function(){writes++;throw Error('RESEARCH_IDB_OPEN_FORBIDDEN')};
    indexedDB.deleteDatabase=function(){writes++;throw Error('RESEARCH_IDB_DELETE_FORBIDDEN')};
    try{
      const selected=document.querySelector('#h05-selected-file').files[0];
      if(!selected)throw Error('NO_SELECTED_FILE');
      const raw=await selected.text();
      const decoded=await window.__r(311).restore(raw,password);
      window.__r(205).validateState(decoded);
      const state=window.__r(205).migrate(decoded);
      return {status:'AUTHENTICATED_SELECTED_FILE',writes,
        transactionIds:state.transactions.map(t=>t.id)};
    }catch(error){
      return {status:'BLOCKED_READ_ONLY',writes};
    }finally{
      Storage.prototype.setItem=set;Storage.prototype.removeItem=remove;
      Storage.prototype.clear=clear;indexedDB.open=open;indexedDB.deleteDatabase=del;
    }
  },password);
  const after=await footprint(page);
  assert.equal(result.writes,0,name+' selected-file authentication must not write');
  assert.deepEqual(after,before,name+' must preserve all destination storage/IDB');
  assert.equal(result.status,expectSuccess?'AUTHENTICATED_SELECTED_FILE':'BLOCKED_READ_ONLY',name);
  console.log('PASS RESEARCH '+name+': '+result.status+'; destination zero writes');
  return result;
}
async function main(){
  const server=http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false});
    const page=await context.newPage();
    const url='http://127.0.0.1:'+server.address().port+PREFIX+'?fa_real=1';
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>typeof window.__r==='function'&&
      typeof window.__r(311).backup==='function'&&
      typeof window.__r(311).restore==='function'&&
      typeof window.__r(205).validateState==='function',null,{timeout:30000});
    await page.evaluate(()=>{
      const input=document.createElement('input');
      input.type='file';input.id='h05-selected-file';input.accept='.json,application/json';
      input.style.position='fixed';input.style.top='0';input.style.left='0';
      input.style.zIndex='2147483647';document.body.appendChild(input);
    });
    const old=fixture();
    const newer={...old,transactions:[...old.transactions,
      {...old.transactions[0],id:'h05-newer-not-in-backup',amount:775}]};
    const valid=await page.evaluate(async({state,password})=>
      window.__r(311).backup(state,password,n=>crypto.getRandomValues(new Uint8Array(n))),
      {state:old,password:PASSWORD});
    assert.ok(!valid.includes('h05-old-expense'),'backup must not expose synthetic ledger IDs');
    const accepted=await selectAndInspect(page,{name:'H05 valid older selected backup',
      text:valid,password:PASSWORD,expectSuccess:true});
    assert.deepEqual(accepted.transactionIds,['h05-old-expense']);
    assert.equal(newer.transactions.length,2);
    assert.ok(!accepted.transactionIds.includes('h05-newer-not-in-backup'),
      'Authenticated selected file is not proof of latest history');
    const env=JSON.parse(valid);
    const changedData={...env,data:(env.data[0]==='0'?'1':'0')+env.data.slice(1)};
    const cases=[
      ['H06 wrong password',valid,'Incorrect-Synthetic-Password'],
      ['H06 tampered ciphertext',JSON.stringify(changedData),PASSWORD],
      ['H06 unsupported backup version',JSON.stringify({...env,version:99}),PASSWORD],
      ['H06 unsupported KDF',JSON.stringify({...env,kdf:'unknown'}),PASSWORD],
      ['H06 authentic but invalid financial schema',authenticInvalidSchema(valid),PASSWORD],
      ['H06 malformed selected JSON','{',PASSWORD]
    ];
    for(const [name,text,password] of cases)
      await selectAndInspect(page,{name,text,password,expectSuccess:false});
    await context.close();
    console.log('LIMIT: test-only File API + actual WEB crypto/schema; no import, newest-history assertion, HTTPS cutover, atomic commit or Safari verification');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1});
