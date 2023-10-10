export type CustomField = {
  self: string;
  disabled: boolean;
  id: string;
  value: string;
};

export type IssueType = {
  self: string;
  avatarId: number;
  description: string;
  iconUrl: string;
  id: string;
  name: string;
  subtask: boolean;
};

export type StatusCategory = {
  self: string;
  id: number;
  key: string;
  name: string;
  colorName: string;
};

export type Status = {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
  statusCategory: StatusCategory;
};

export type Priority = {
  id: string;
  self: string;
  name: string;
  iconUrl: string;
};

export type SubTaskField = {
  summary: string;
  status: Status;
  priority: Priority;
  issuetype: IssueType;
};

export type SubTask = {
  id: string;
  key: string;
  self: string;
  fields: SubTaskField;
};

export type AvatarUrls = {
  "48x48": string;
  "24x24": string;
  "16x16": string;
  "32x32": string;
};

export type Author = {
  self: string;
  name: string;
  key: string;
  emailAddress: string;
  avatarUrls: AvatarUrls;
  displayName: string;
  active: boolean;
  timeZone: string;
};

export type CommentField = {
  self: string;
  id: string;
  author: Author;
  body: string;
  updateAuthor: Author;
  created: string;
  updated: string;
};

export type JiraComment = {
  comments: CommentField[];
  maxResults: number;
  startAt: number;
  total: number;
};

export type JiraAttachment = {
  self: string;
  id: string;
  filename: string;
  author: Author;
  created: string;
  size: number;
  mimeType: string;
  content: string;
};

export type RenderedFields = {
  description: string;
  comment: JiraComment;
};

export type AmtJiraFields = {
  attachment: JiraAttachment[];
  customfield_10700: string; // ARTGID
  customfield_11009: string; // Date requested
  customfield_11900: CustomField[]; // Schedule
  customfield_11901: CustomField[]; // AMT Flags
  customfield_12000: string; // ARTG Start date
  customfield_12002: string; // Inactive Date
  customfield_12200: string; // Latest effective date for product
  customfield_12301: CustomField[]; // Internal/External Request
  customfield_12300: string[]; // External requester name or BlackTriangle
  description: string;
  issuetype: IssueType;
  labels: string[];
  status: Status;
  subtasks: SubTask[];
  summary: string;
  comment: JiraComment;
  assignee: Author;
};

export type AmtJiraTicket = {
  expand: string;
  fields: AmtJiraFields;
  id: string;
  key: string;
  self: string;
  renderedFields: RenderedFields;
};

export type AmtJiraTickets = {
  expand: string;
  issues: AmtJiraTicket[];
  maxResults: number;
  startAt: number;
  total: number;
};

export type AdditionalFieldType = {
  name: string;
  description: string;
  listType: boolean;
};

export type AdditionalFieldValue = {
  additionalFieldType: AdditionalFieldType;
  valueOf: string;
};

export type Attachment = {
  created: string;
  description: string;
  location: string;
  thumbnailLocation: string | null;
  filename: string;
  length: number;
  sha256: string;
  attachmentType: {
    name: string;
    mimeType: string;
  };
};

export type Comment = {
  created: string;
  text: string;
};

export type State = {
  label: string;
  description: string;
};

export type Labels = {
  name: string;
  description: string;
  displayColor: string;
};

export type TicketType = {
  name: string;
  description: string;
};

export type TicketDto = {
  id: number;
  ticketType: TicketType;
  title: string;
  assignee: string;
  description: string;
  state: State;
  labels: Labels[];
  "ticket-comment": Comment[];
  "ticket-additional-fields": AdditionalFieldValue[];
  "ticket-attachment": Attachment[];
};
