// في vite.config.ts:
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',  // ⬅️ تأكد من وجود هذا
  build: {
    outDir: 'dist',
    sourcemap: false  // ⬅️ أضف هذا لتفادي مشاكل
  }
});
