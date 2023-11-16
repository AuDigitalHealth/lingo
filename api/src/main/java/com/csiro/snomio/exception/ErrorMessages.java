package com.csiro.snomio.exception;

public class ErrorMessages {

  public static final String TICKET_ID_NOT_FOUND = "Ticket with ID %s not found";
  public static final String LABEL_ID_NOT_FOUND = "Label with ID %s not found";
  public static final String TASK_ASSOCIATION_ID_NOT_FOUND = "TaskAssociation with ID %s not found";
  public static final String TASK_ASSOCIATION_ALREADY_EXISTS =
      "TaskAssociation already exists for ticket with id %s";
  public static final String PRIORITY_BUCKET_ID_NOT_FOUND = "Priority Bucket with ID %s not found";
  public static final String ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND =
      "Additional field with ID %s not found";
  public static final String ITERATION_NOT_FOUND = "Iteration with ID %s not found";

  private ErrorMessages() {}
}
