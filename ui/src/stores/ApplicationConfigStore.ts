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

import { create } from 'zustand';
import ApplicationConfig from '../types/applicationConfig';
import logoIcon from '../assets/images/logo/snowflake-prod.svg';
import uatIcon from '../assets/images/logo/snowflake-uat.svg';
import devIcon from '../assets/images/logo/snowflake-dev.svg';

const emptyApplicationConfig = {
  appName: '',
  imsUrl: '',
  apUrl: '',
  apProjectKey: '',
  apDefaultBranch: '',
  apSnodineDefaultBranch: '',
  apLanguageHeader: '',
  apApiBaseUrl: '',
  fhirServerBaseUrl: '',
  fhirServerExtension: '',
  fhirPreferredForLanguage: '',
  fhirRequestCount: '',
  snodineSnowstormProxy: '',
  snodineExtensionModules: [],
  appEnvironment: '',
};
interface ApplicationConfigStoreConfig {
  applicationConfig: ApplicationConfig;
  updateApplicationConfigState: (configState: ApplicationConfig) => void;
  isProdEnvironment: () => boolean;
  getEnvironmentColor: () => string;
  getLogo: () => string | undefined;
}

const useApplicationConfigStore = create<ApplicationConfigStoreConfig>()(
  (set, get) => ({
    applicationConfig: emptyApplicationConfig,
    updateApplicationConfigState: (configState: ApplicationConfig) =>
      set(() => ({
        applicationConfig: configState,
      })),
    isProdEnvironment: () => {
      const { applicationConfig } = get();
      return applicationConfig.appEnvironment.includes('prod');
    },
    getEnvironmentColor: () => {
      const { applicationConfig } = get();

      if (applicationConfig.appEnvironment.includes('prod')) {
        return 'black';
      } else if (applicationConfig.appEnvironment.includes('uat')) {
        return 'green';
      }
      return 'red'; // Default red for other environments
    },
    getLogo: () => {
      const { applicationConfig } = get();
      if (applicationConfig?.appEnvironment.includes('prod')) {
        return logoIcon;
      } else if (applicationConfig?.appEnvironment.includes('uat')) {
        return uatIcon;
      } else if (
        applicationConfig?.appEnvironment.includes('dev') ||
        applicationConfig?.appEnvironment.includes('local')
      ) {
        return devIcon;
      } else {
        return undefined; //Fix icon if not found
      }
    },
  }),
);
export default useApplicationConfigStore;
