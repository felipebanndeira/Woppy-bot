const { spawn } = require('child_process');

console.log("🚀 [Runner] Iniciando Web y Worker de WhatsApp...");

// 1. Arrancar Next.js Web
const web = spawn('npx', ['next', 'start'], { stdio: 'inherit', shell: true });

// 2. Arrancar Worker de WhatsApp con tsx
const worker = spawn('npx', ['tsx', 'src/worker/index.ts'], { stdio: 'inherit', shell: true });

web.on('close', (code) => {
  console.log(`[Web] Proceso finalizado con código ${code}`);
  process.exit(code || 0);
});

worker.on('close', (code) => {
  console.log(`[Worker] Proceso finalizado con código ${code}`);
});

process.on('SIGTERM', () => {
  web.kill('SIGTERM');
  worker.kill('SIGTERM');
});
