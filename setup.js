
// Add any setup logic here
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Setting up the application...');

try {
  // Build the client using Vite from the root configuration
  console.log('Building the client application...');
  execSync('vite build', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname)  // Run from the current directory
  });
  
  console.log('Setup completed successfully!');
} catch (error) {
  console.error('Setup failed:', error.message);
  process.exit(1);
}
