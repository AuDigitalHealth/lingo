import { JiraUser } from './JiraUserResponse';

export interface Project {
  key: string;
  title: string;
  projectLead: JiraUser;
  branchPath: string;
  branchState: string;
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
