package com.csiro.tickets.controllers.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AttachmentUploadResponse {

  private Long ticketId;

  private String message;

  private String sha256;

  private Long attachmentId;

  public static final String MESSAGE_SUCCESS = "Upload successful";
  public static final String MESSAGE_EMPTYFILE = "File is empty";
  public static final String MESSAGE_MISSINGTICKET = "Ticket does not exist";
}
