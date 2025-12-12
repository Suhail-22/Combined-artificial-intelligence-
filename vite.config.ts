import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Robustly try to get the API Key from multiple sources
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Inject the key securely
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});