// Reproducible candidate builder. Does NOT publish or change index.html.
// Usage: node scripts/prepare-v1822.cjs --write
// Source is the immutable v18.21 release; v18.20 is never read or changed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const input = path.join(__dirname, '..', '_expo/static/js/web/index-v01821-accessibility-shell-20261022.js');
const output = path.join(__dirname, '..', '_expo/static/js/web/index-v01822-reconciliation-20261022.js');
const changes = [
  ['h=n.opening+b(e,t,s,d)+l(e,d),v=k-h', 'v=k-u'],
  ['version:"18.21"', 'version:"18.22"'],
  ['financial-autonomy-diagnostic-unic-v18.21.json', 'financial-autonomy-diagnostic-unic-v18.22.json']
];

function candidate() {
  let source = fs.readFileSync(input, 'utf8');
  for (const [before, after] of changes) {
    if (source.split(before).length !== 2) throw Error('Expected exactly one match: ' + before);
    source = source.replace(before, after);
  }
  return source;
}

if (require.main === module) {
  const built = candidate();
  if (process.argv.includes('--write')) {
    if (fs.existsSync(output)) throw Error('Refusing to overwrite immutable release bundle: ' + output);
    fs.writeFileSync(output, built, {flag:'wx'});
    console.log('Created candidate: ' + output);
  } else {
    console.log('Candidate generated in memory; no files written.');
  }
  console.log('SHA256 ' + crypto.createHash('sha256').update(built).digest('hex'));
}
module.exports = { candidate, input, output };
