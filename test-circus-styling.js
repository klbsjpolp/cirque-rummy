import { spawn } from 'child_process';

console.log('🎪 Testing CIRQUE RUMMY Circus Styling...');
console.log('Starting development server...');

const dev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

dev.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🎭 Stopping circus test...');
  dev.kill();
  process.exit();
});
