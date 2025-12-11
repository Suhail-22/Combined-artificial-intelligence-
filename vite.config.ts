import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  plugins: [react()],
  define: {
    'process.env': {
      GEMINI_API_KEY: JSON.stringify(process.env.GEMINI_API_KEY),
      API_KEY: JSON.stringify(process.env.GEMINI_API_KEY),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }
  }
});