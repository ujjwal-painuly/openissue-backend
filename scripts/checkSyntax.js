import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function collectJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory()
      ? collectJavaScriptFiles(fullPath)
      : entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const files = [
  ...collectJavaScriptFiles('src'),
  ...collectJavaScriptFiles('tests'),
  ...collectJavaScriptFiles('scripts')
];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.info(`Syntax check passed for ${files.length} JavaScript files.`);
