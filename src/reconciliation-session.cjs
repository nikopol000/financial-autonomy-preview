// Draft-only reconciliation session. No persistence or account-balance mutation.
// Amounts are integer bani; effects are signed changes to the selected account.
function createSession({checkId, accountId, difference}) {
  if (!checkId || !accountId || !Number.isSafeInteger(difference)) throw Error('Invalid reconciliation session');
  return {checkId, accountId, initialDifference:difference, entries:[]};
}
function addEntry(session, entry) {
  if (!entry?.id || !Number.isSafeInteger(entry.effect) || !entry.effect) throw Error('Invalid entry');
  if (session.entries.some(e=>e.id===entry.id)) throw Error('Duplicate entry');
  return {...session,entries:[...session.entries,{...entry}]};
}
function updateEntry(session, id, entry) {
  if (!session.entries.some(e=>e.id===id)) throw Error('Entry missing');
  if (!Number.isSafeInteger(entry.effect) || !entry.effect) throw Error('Invalid entry');
  return {...session,entries:session.entries.map(e=>e.id===id?{...entry,id}:e)};
}
function removeEntry(session,id) {return {...session,entries:session.entries.filter(e=>e.id!==id)};}
function remaining(session) {return session.initialDifference-session.entries.reduce((sum,e)=>sum+e.effect,0);}
function commitSession(session, persistAll) {
  // The caller must persist every entry in one validated state update.
  if (typeof persistAll!=='function') throw Error('Atomic save callback required');
  return persistAll(session.entries.map(e=>({...e,reconciliationCheckId:session.checkId})));
}
module.exports={createSession,addEntry,updateEntry,removeEntry,remaining,commitSession};
