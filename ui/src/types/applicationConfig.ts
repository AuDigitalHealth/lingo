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
