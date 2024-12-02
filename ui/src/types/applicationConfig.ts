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

export default interface ApplicationConfig {
  appName: string;
  imsUrl: string;
  apUrl: string;
  apProjectKey: string;
  apDefaultBranch: string;
  apSnodineDefaultBranch: string;
  apLanguageHeader: string;
  apApiBaseUrl: string;
  fhirServerBaseUrl: string;
  fhirServerExtension: string;
  fhirPreferredForLanguage: string;
  fhirRequestCount: string;
  snodineSnowstormProxy: string;
  snodineExtensionModules: string[];
  appEnvironment: string;
}

export interface ServiceStatus {
  authoringPlatform: Status;
  snowstorm: StatusWithEffectiveDate;
  cis: Status;
}

export interface Status {
  running: boolean;
  version: string;
}

export interface StatusWithEffectiveDate extends Status {
  effectiveDate?: string;
}
export interface SecureAppConfig {
  sentryDsn: string;
  sentryEnvironment: string;
  sentryTracesSampleRate: string;
  sentryEnabled: boolean;
}
