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

import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const username = `${process.env.IMS_USERNAME || ''}`;
const password = `${process.env.IMS_PASSWORD || ''}`;
const imsUrl = `${process.env.VITE_IMS_URL || ''}`;
const frontendUrl = `${process.env.VITE_SNOMIO_UI_TEST_URL || 'https://localhost:5173/'}`;
const apUrl = `${process.env.VITE_AP_URL || ''}`;
const snowStormUrl = `${process.env.VITE_SNOWSTORM_URL || ''}`;
const apProjectKey = `${process.env.IHTSDO_PROJECT_KEY || 'AUAMT'}`;
const apDefaultBranch = 'MAIN/SNOMEDCT-AU/AUAMT';

// MOCK_MODE defaults to true — tests run with mocks unless explicitly disabled
const mockMode = process.env.CYPRESS_MOCK_MODE !== 'false';

export default defineConfig({
  projectId: 'jvymjj',
  env: {
    MOCK_MODE: mockMode,
    frontend_url: frontendUrl,
    backend_url: '',
    ims_url: imsUrl,
    ims_username: username,
    ims_password: password,
    apUrl: apUrl,
    apProjectKey: apProjectKey,
    apDefaultBranch: apDefaultBranch,
    snowStormUrl: snowStormUrl,
  },
  viewportHeight: 1080,
  viewportWidth: 1920,
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        table(message) {
          console.table(message);
          return null;
        },
        log(message) {
          console.log(message);
          return null;
        },
        /**
         * remock task: saves captured network traffic to a fixture file.
         * Called by the remock script after traffic capture completes.
         */
        saveFixture({ filePath, data }: { filePath: string; data: unknown }) {
          const fullPath = path.resolve(__dirname, 'cypress/fixtures/api', filePath);
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
          return null;
        },
        /**
         * Reads a fixture file as JSON — useful in remock flows.
         */
        readFixture(filePath: string) {
          const fullPath = path.resolve(__dirname, 'cypress/fixtures/api', filePath);
          if (!fs.existsSync(fullPath)) return null;
          return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        },
      });
    },
    baseUrl: frontendUrl,
    experimentalStudio: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 4,
    screenshotOnRunFailure: true,
    video: true,
  },
});
