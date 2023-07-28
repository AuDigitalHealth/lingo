import { defineConfig, loadEnv } from 'vite';
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

    server: {
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