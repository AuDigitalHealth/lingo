///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const imsBaseUrl = `${process.env.VITE_IMS_URL}`;
  const snomioBaseUrl = `${process.env.VITE_SNOMIO_URL}`;
  const apUrl = `${process.env.VITE_AP_URL}`;
  const snowstormUrl = `${process.env.VITE_SNOWSTORM_URL}`;
  const snodineSnowstormUrl = `${process.env.VITE_SNODINE_SNOWSTORM_URL || snowstormUrl}`;

  return defineConfig({
    plugins: [react(), basicSsl()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      reporters: 'junit',
      outputFile: 'reports/junit.xml',
      // testMatch: ['./tests/**/*.test.tsx'],
      globals: true,
    },
    build: {
      outDir: '../api/src/main/resources/static',
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          target: snomioBaseUrl,
          changeOrigin: false,
          secure: false,
          rewrite: path => path.replace(/^\/api\/branch/, '/api/'),
        },
        '/authoring-services': {
          target: apUrl,
          changeOrigin: true,
          secure: true,
          rewrite: path =>
            path.replace(/^\/authoring-services/, '/authoring-services'),
          ws: true,
        },
        '/snowstorm': {
          target: snowstormUrl,
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/snowstorm/, ''),
          ws: true,
        },
        '/snodineSnowstorm': {
          target: snodineSnowstormUrl,
          changeOrigin: true,
          secure: true,
          rewrite: path => path.replace(/^\/snodineSnowstorm/, ''),
          ws: true,
        },
        '/$defs': {
          target: snomioBaseUrl,
          changeOrigin: false,
          secure: false,
        },
        '/config': {
          target: snomioBaseUrl,
          changeOrigin: false,
          secure: false,
        },
      },
    },
    // needed for SockJs
    define: {
      global: 'window',
    },
  });
};
