
// Add any setup logic here
const { execSync } = require('child_process');
const path = require('path');

console.log('Setting up the application...');

try {
  // Build the client using Vite from the root configuration
  console.log('Building the client application...');
  execSync('vite build', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')  // Run from the parent directory
  });
  
  console.log('Setup completed successfully!');
} catch (error) {
  console.error('Setup failed:', error.message);
  process.exit(1);
}
