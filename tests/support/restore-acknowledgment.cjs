'use strict';
// TEST-ONLY design probe for #4/#29/#35. Not imported by the shipped WEB bundle.
// This classifier NEVER writes to storage. It is only meaningful while the caller
// holds the same exclusive origin lock as cooperating vault writers; it cannot
// defend against legacy tabs, full-origin rollback, or a hostile storage layer.
const {isDeepStrictEqual}=require('node:util');
const KEYS=Object.freeze([
  'financial-autonomy.preview.key.v1',
  'financial-autonomy.preview.payload.v1',
  'financial-autonomy.preview.reset.v1'
]);
const owns=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function readFootprint(storage){
  const values=Object.create(null);
  for(const key of KEYS){
    const value=storage.getItem(key);
    if(value!==null&&typeof value!=='string')throw new TypeError('Non-string storage value');
    values[key]=value;
  }
  return values;
}
function sameFootprint(a,b){
  return !!a&&!!b&&KEYS.every(key=>owns(a,key)&&owns(b,key)&&a[key]===b[key]);
}
function classifyRestoreAcknowledgment({before,storage,expectedState,authenticate}){
  const unknown=reason=>({status:'unknown',reason});
  if(!sameFootprint(before,before)||!storage||typeof authenticate!=='function')
    return unknown('invalid_preflight');
  let first;
  try{first=readFootprint(storage)}catch{return unknown('read_denied')}
  // Byte-identical evidence is a conservative no-change observation, not a
  // guarantee of transaction history or protection from origin-wide rollback.
  if(sameFootprint(first,before)){
    let second;
    try{second=readFootprint(storage)}catch{return unknown('read_denied')}
    return sameFootprint(first,second)
      ?{status:'verified_unchanged',reason:'same_protected_bytes'}
      :unknown('changed_during_verification');
  }
  // A changed reset epoch invalidates any assertion about restore authority.
  if(first[KEYS[2]]!==before[KEYS[2]])return unknown('reset_epoch_changed');
  let authenticated;
  try{authenticated=authenticate(storage)}catch{return unknown('authentication_failed')}
  if(authenticated&&typeof authenticated.then==='function')
    return unknown('asynchronous_authenticator');
  let second;
  try{second=readFootprint(storage)}catch{return unknown('read_denied')}
  if(!sameFootprint(first,second))return unknown('changed_during_verification');
  if(!isDeepStrictEqual(authenticated,expectedState))
    return unknown('unexpected_authenticated_state');
  // A matching authenticated state is NOT proof that this specific attempt
  // committed. A previous identical state or uncooperative writer may exist.
  return {status:'verified_target_present',reason:'authenticated_expected_state'};
}
module.exports={KEYS,readFootprint,sameFootprint,classifyRestoreAcknowledgment};
