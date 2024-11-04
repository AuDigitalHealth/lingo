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
dotenv.config();

const username = `${process.env.IMS_USERNAME}`;
const password = `${process.env.IMS_PASSWORD}`;
const imsUrl = `${process.env.VITE_IMS_URL}`;
const frontendUrl = `${process.env.VITE_SNOMIO_UI_URL}`;
const apUrl = `${process.env.VITE_AP_URL}`;
const apProjectKey = `${process.env.IHTSDO_PROJECT_KEY}`;
const apDefaultBranch = 'MAIN/SNOMEDCT-AU/AUAMT';

export default defineConfig({
  projectId: 'jvymjj',
  env: {
    frontend_url: frontendUrl,
    backend_url: '',
    ims_url: imsUrl,
    ims_username: username,
    ims_password: password,
    apUrl: apUrl,
    apProjectKey: apProjectKey,
    apDefaultBranch: apDefaultBranch,
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
      });
    },
    baseUrl: frontendUrl,
  },
});
