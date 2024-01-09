import { ReactElement } from 'react';

// ==============================|| AUTH TYPES  ||============================== //

export type AttachmentUploadResponse = {
  ticketId: string;
  message: string;
  sha256: string;
  attachmentId: number;
};
