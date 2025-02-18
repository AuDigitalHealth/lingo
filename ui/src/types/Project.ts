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

import { JiraUser } from './JiraUserResponse';

export interface Project {
  key: string;
  title: string;
  projectLead: JiraUser;
  metadata: Metadata;
  branchPath: string;
  branchState: string;
  defaultModuleId: string;
}

export interface Metadata {
  defaultNamespace: string;
  internal: {
    classified: string;
  };
  dependencyRelease: string;
  previousDependencyPackage: string;
  expectedExtensionModules: string[];
  codeSystemShortName: string;
  failureExportMax: string;
  previousPackage: string;
  defaultReasonerNamespace: string;
  authoringFreeze: string;
  requiredLanguageRefsets: LanguageRefset[];
  annotationsEnabled: string;
  shortname: string;
  assertionGroupNames: string;
  previousRelease: string;
  multipleModuleEditingDisabled: string;
  dependencyPackage: string;
  defaultModuleId: string;
  releaseAssertionGroupNames: string;
  enableRvfTicketGeneration: string;
  'vc.parent-branches-excluded.entity-class-names': string[];
}

export interface LanguageRefset {
  default: string; // a string boolean
  en: string;
  readOnly?: string; // a string boolean
  dialectName: string;
}
export interface BranchDetails {
  path: string;
  state: string;
  locked: boolean;
  containsContent: boolean;
  metadata: BranchMetadata;
}
export interface BranchMetadata {
  internal: {
    classified: string;
  };
}
export interface BranchCreationRequest {
  parent: string;
  name: string;
}
