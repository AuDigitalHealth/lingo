import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const imsBaseUrl = `${process.env.VITE_IMS_URL}`;
  const snomioBaseUrl = `${process.env.VITE_SNOMIO_URL}`;

  return defineConfig({
    plugins: [
      react(),
      basicSsl()
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      reporters: 'junit',
      outputFile: 'reports/junit.xml',
      // testMatch: ['./tests/**/*.test.tsx'],
      globals: true
    },
    build:{
      outDir: '../api/src/main/resources/static'
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          target: snomioBaseUrl,
          changeOrigin: false,
          secure: false,
        }
      },
    },
  });
};