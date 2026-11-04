#!/usr/bin/env node
'use strict';
// Research-only compatibility gate. No storage writes, browser state, or real data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const archivedPath = '_expo/static/js/web/index-v01820-history-back-navigation-20261014.js';
const html = fs.readFileSync('index.html', 'utf8');
const activePath = html.match(/<script src="\/financial-autonomy-preview\/([^"?]+\.js)\?build=/)?.[1];
assert.ok(activePath, 'Active bundle path missing');
const files = {archived:archivedPath,active:activePath};
const requiredKeys = ['financial-autonomy.preview.key.v1','financial-autonomy.preview.payload.v1'];
const report = {};
for (const [label,file] of Object.entries(files)) {
  const source = fs.readFileSync(file,'utf8');
  const modules = {};
  for (const id of [309,310,311]) {
    const pattern = new RegExp('\\},'+id+',\\[([^\\]]*)\\]\\);','g');
    const matches = [...source.matchAll(pattern)];
    assert.equal(matches.length,1,label+' Metro module '+id+' missing/ambiguous');
    const match = matches[0];
    const start = source.lastIndexOf('__d(function(',match.index);
    assert.ok(start >= 0 && match.index > start,label+' Metro factory '+id+' missing');
    const factory = source.slice(start,match.index+1);
    modules[id] = {dependencies:match[1].split(',').filter(Boolean).map(Number),
      bytes:factory.length,
      hasWebCrypto: /subtle|crypto|encrypt|decrypt/.test(factory),
      storageKeyMentions:requiredKeys.filter(key=>factory.includes(key))};
  }
  assert.ok(requiredKeys.every(key=>source.includes(key)),label+' legacy vault keys missing');
  report[label] = {file,modules,keysPresent:true};
}
console.log(JSON.stringify({status:'PASS',scope:'static-archived-module-compatibility-preflight-only',
  report,authenticatedFixtureTested:false,twoTabsTested:false,resetTested:false,realData:false}));
