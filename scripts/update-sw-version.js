/**
 * Updates the service worker cache version with current build timestamp.
 * Run automatically before each build to ensure cache invalidation.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = join(__dirname, '../public/sw.js');

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const version = `v${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

let content = readFileSync(swPath, 'utf-8');

// Replace the hardcoded version with dynamic one
content = content.replace(
  /CACHE_VERSION = 'v[^']+';/,
  `CACHE_VERSION = '${version}';`
);

writeFileSync(swPath, content, 'utf-8');
console.log(`[update-sw-version] Cache version updated to: ${version}`);