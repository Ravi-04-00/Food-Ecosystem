import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS = [
  { name: 'customer-app', dir: path.join(__dirname, 'customer-app') },
  { name: 'restaurant-app', dir: path.join(__dirname, 'restaurant-app') },
  { name: 'delivery-partner-app', dir: path.join(__dirname, 'delivery-partner-app') },
  { name: 'admin-app', dir: path.join(__dirname, 'admin-app') }
];

console.log('📦 Building all 4 FD Foods React applications...\n');

let failed = false;
for (const app of APPS) {
  console.log(`🔨 Building ${app.name}...`);
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: app.dir,
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    console.error(`❌ Build failed for ${app.name}`);
    failed = true;
    break;
  }
  console.log(`✅ ${app.name} built successfully.\n`);
}

if (failed) {
  process.exit(1);
} else {
  console.log('🎉 All 4 frontend applications built successfully!');
}
