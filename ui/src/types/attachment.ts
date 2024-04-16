// ==============================|| Attachment TYPES  ||============================== //

export enum AttachmentUploadMessage {
  SUCCESS = 'Upload successful',
  EMPTYFILE = 'File is empty',
  MISSINGTICKET = 'Ticket does not exist',
}

export interface AttachmentUploadResponse {
  ticketId: number;
  message: AttachmentUploadMessage;
  sha256: string;
  attachmentId: number;
}
