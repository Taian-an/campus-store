import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Nginx proxies /campus-store/ through without stripping the prefix, so a
// production build's asset URLs must resolve under that same base path
// (proposal §10.1). Local dev (`npm run dev`) stays at root.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/campus-store/' : '/',
}));
