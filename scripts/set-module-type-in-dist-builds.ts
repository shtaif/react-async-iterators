import { writeFile } from 'node:fs/promises';

for (const [distDirName, packageFileContents] of Object.entries({
  'dist/esm': { type: 'module' },
  'dist/cjs': { type: 'commonjs' },
})) {
  const destPath = `${import.meta.dirname}/../${distDirName}/package.json`;
  const output = JSON.stringify(packageFileContents, undefined, 2);
  await writeFile(destPath, output);
}
