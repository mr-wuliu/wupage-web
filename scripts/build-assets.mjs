import { cp, mkdir, readdir, rm } from 'node:fs/promises';
const output = new URL('../dist/public/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of await readdir(new URL('../', import.meta.url), { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith('.html') || entry.name === '_headers')) {
    await cp(new URL(`../${entry.name}`, import.meta.url), new URL(entry.name, output));
  }
}
await cp(new URL('../assets/', import.meta.url), new URL('assets/', output), { recursive: true });
console.log('Public HTML, assets and headers copied to dist/public.');
