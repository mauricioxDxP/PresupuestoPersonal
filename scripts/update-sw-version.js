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
const version = `v${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

let content = readFileSync(swPath, 'utf-8');

// Replace the hardcoded version with dynamic one
content = content.replace(
  /const CACHE_VERSION = 'v\d{8}';/,
  `const CACHE_VERSION = '${version}';`
);

writeFileSync(swPath, content, 'utf-8');
console.log(`[update-sw-version] Cache version updated to: ${version}`);