import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const required = { next: '15.5.29', react: '19.1.10', 'react-dom': '19.1.10', postcss: '8.5.32' };
for (const [name, expected] of Object.entries(required)) {
  assert.equal(pkg.dependencies[name], expected, `package.json: ${name} deve ser ${expected}`);
  try {
    const installed = JSON.parse(readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url), 'utf8'));
    assert.equal(installed.version, expected, `${name}: versão instalada incorreta`);
    console.log(`OK: ${name}@${expected}`);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(`${name}: ainda não instalado. Execute npm install antes de verificar.`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

assert.equal(pkg.overrides?.postcss, '8.5.32', 'Override de PostCSS deve impedir dependências transitivas antigas');
