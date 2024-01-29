export default interface ApplicationConfig {
  appName: string;
  imsUrl: string;
  apUrl: string;
  apProjectKey: string;
  apDefaultBranch: string;
  apLanguageHeader: string;
}

export interface ServiceStatus {
  authoringPlatform: Status;
  snowstorm: Status;
}

export interface Status {
  running: boolean;
  version: string;
}
