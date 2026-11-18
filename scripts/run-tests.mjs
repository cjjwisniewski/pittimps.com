import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

if (process.env.GITHUB_ACTIONS !== 'true') {
  console.error(
    'Refusing to run tests locally: tests are restricted to GitHub Actions CI (GITHUB_ACTIONS=true).'
  );
  process.exit(1);
}

const require = createRequire(import.meta.url);
const vitePkgPath = require.resolve('vite/package.json');
const esbuildPath = require.resolve('esbuild', { paths: [path.dirname(vitePkgPath)] });
const esbuild = require(esbuildPath);

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const testsDir = path.join(repoRoot, 'tests');
const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.mjs') || f.endsWith('.test.ts'))
  .map((f) => path.join(testsDir, f));

if (testFiles.length === 0) {
  console.error('No test files found in tests/.');
  process.exit(1);
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pittimps-tests-'));

try {
  const compiledFiles = [];

  for (const entry of testFiles) {
    const outFile = path.join(outDir, `${path.basename(entry)}.mjs`);
    await esbuild.build({
      entryPoints: [entry],
      outfile: outFile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      packages: 'external'
    });
    compiledFiles.push(outFile);
  }

  execFileSync(process.execPath, ['--test', ...compiledFiles], {
    stdio: 'inherit',
    cwd: repoRoot
  });
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
