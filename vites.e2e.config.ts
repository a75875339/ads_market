import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    // Environment
    environment: 'node',
    
    // Test files
    include: ['**/*.e2e.spec.ts'],

    
    // Timeout
    testTimeout: 30000,

  },
   plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
    }),
  ],
  resolve: {
    // Handle .js extensions in imports
    extensions: ['.ts', '.js', '.json'],
  },
})