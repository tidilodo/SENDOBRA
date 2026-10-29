import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
const paths = execFileSync('git', ['ls-files', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean);
const findings = [];
for (const path of paths) {
  if (/(^|\/)(node_modules|\.wrangler|\.sites-runtime|\.vercel|auth)\//.test(path) || /(^|\/)\.env(?!\.example$)/.test(path) || /\.(sqlite\w*|pem|key)$/.test(path)) {findings.push(path); continue;}
  if (statSync(path).size > 2_000_000) continue;
  const content = readFileSync(path, 'utf8');
  if (/gh[pousr]_[A-Za-z0-9]{25,}|art_v2_[A-Za-z0-9_]{15,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) findings.push(path);
}
if (findings.length) {console.error('Review sensitive files:\n' + findings.join('\n')); process.exit(1);}
console.log(`Checked ${paths.length} tracked files; no configured secret patterns found.`);
