import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // Live mode against a local backend: set VITE_API_PROXY_TARGET, keep VITE_API_BASE_URL=/api/v1.
      proxy: env.VITE_API_PROXY_TARGET
        ? { '/api': { target: env.VITE_API_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.{js,jsx}', 'tests/unit/**/*.test.{js,jsx}'],
      setupFiles: ['tests/setup/vitest.setup.js'],
      passWithNoTests: true,
      restoreMocks: true,
    },
  };
});
