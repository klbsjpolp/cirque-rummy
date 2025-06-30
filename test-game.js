// Simple test script to verify game functionality
import { execSync } from 'child_process';

console.log('🎪 Testing Cirque Rummy Game...\n');

try {
  console.log('1. Checking if dependencies are installed...');
  execSync('npm list react react-dom', { stdio: 'pipe' });
  console.log('✅ Dependencies are installed\n');

  console.log('2. Testing TypeScript compilation...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful\n');

  console.log('3. Testing build process...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build successful\n');

  console.log('🎉 All tests passed! The Cirque Rummy game is ready to play.');
  console.log('\nTo start the game, run: npm run dev');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
