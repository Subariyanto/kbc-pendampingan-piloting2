import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repository name on GitHub. Change to match your repo before deploy.
// Example: if repo URL is https://github.com/Subariyanto/kbc-piloting,
// set REPO_NAME = 'kbc-piloting'.
const REPO_NAME = 'kbc-pendampingan-piloting2';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // For GitHub Pages: served at https://<user>.github.io/<repo>/
  // Use absolute base in production, relative in dev.
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
