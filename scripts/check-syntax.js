const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');

const ignoredDirectories = new Set(['.git', 'node_modules']);

function findJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : findJavaScriptFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

const failures = findJavaScriptFiles(process.cwd()).filter((file) => {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  return result.status !== 0;
});

if (failures.length > 0) {
  console.error(`Syntax validation failed for ${failures.length} file(s).`);
  process.exitCode = 1;
} else {
  console.log('JavaScript syntax validation passed.');
}
