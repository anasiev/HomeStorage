import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const targetDir = path.join(rootDir, 'go-backend', 'web');

if (fs.existsSync(distDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(distDir, targetDir, { recursive: true });
  console.log(`[build] Successfully synced dist to ${targetDir}`);
} else {
  console.error(`[build] Error: dist directory does not exist at ${distDir}`);
  process.exit(1);
}
