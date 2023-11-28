import { JiraUser } from './JiraUserResponse';

export interface Project {
  key: string;
  title: string;
  projectLead: JiraUser;
  branchPath: string;
  branchState: string;
}
