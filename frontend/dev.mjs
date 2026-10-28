import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS = [
  { name: 'CUSTOMER', dir: path.join(__dirname, 'customer-app'), port: 3000, color: '\x1b[32m' }, // Green
  { name: 'RESTAURANT', dir: path.join(__dirname, 'restaurant-app'), port: 3001, color: '\x1b[34m' }, // Blue
  { name: 'DELIVERY', dir: path.join(__dirname, 'delivery-partner-app'), port: 3002, color: '\x1b[35m' }, // Magenta
  { name: 'ADMIN', dir: path.join(__dirname, 'admin-app'), port: 3003, color: '\x1b[36m' } // Cyan
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}🚀 Starting all 4 FD Foods React Frontends in one command...${RESET}\n`);

const isWindows = process.platform === 'win32';
const children = [];

for (const app of APPS) {
  const prefix = `${app.color}[${app.name} :${app.port}]${RESET} `;
  console.log(`${prefix}Launching in ${app.dir}...`);

  const child = spawn('npm', ['run', 'dev'], {
    cwd: app.dir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        process.stdout.write(`${prefix}${line}\n`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        process.stderr.write(`${prefix}${line}\n`);
      }
    }
  });

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`${prefix}Exited with code ${code}`);
    }
  });

  children.push(child);
}

const shutdown = () => {
  console.log(`\n${BOLD}Shutting down all frontend applications...${RESET}`);
  for (const child of children) {
    if (isWindows && child.pid) {
      spawn('taskkill', ['/pid', child.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    } else {
      child.kill('SIGINT');
    }
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
