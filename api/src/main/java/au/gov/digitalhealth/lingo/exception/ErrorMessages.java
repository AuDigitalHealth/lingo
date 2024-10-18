/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.exception;

public class ErrorMessages {

  public static final String TICKET_ID_NOT_FOUND = "Ticket with ID %s not found";

  public static final String COMMENT_ID_NOT_FOUND = "Comment with ID %s not found";

  public static final String COMMENT_NOT_FOUND_FOR_TICKET =
      "Comment with ID %s not found for Ticket with Id %s";

  public static final String TICKET_NUMBER_NOT_FOUND = "Ticket with Number %s not found";
  public static final String LABEL_ID_NOT_FOUND = "Label with ID %s not found";

  public static final String LABEL_NAME_NOT_FOUND = "Label with Name %s not found";

  public static final String EXTERNAL_REQUESTOR_NAME_NOT_FOUND =
      "External Requestor with Name %s not found";

  public static final String EXTERNAL_REQUESTOR_ID_NOT_FOUND =
      "External Requestor with ID %s not found";
  public static final String TASK_ASSOCIATION_ID_NOT_FOUND = "TaskAssociation with ID %s not found";
  public static final String TASK_ASSOCIATION_ALREADY_EXISTS =
      "TaskAssociation already exists for ticket with id %s";
  public static final String PRIORITY_BUCKET_ID_NOT_FOUND = "Priority Bucket with ID %s not found";
  public static final String ADDITIONAL_FIELD_VALUE_ID_NOT_FOUND =
      "Additional field with ID %s not found";
  public static final String ITERATION_NOT_FOUND = "Iteration with ID %s not found";

  public static final String STATE_NOT_FOUND = "State with ID %s not found";

  public static final String STATE_LABEL_NOT_FOUND = "State with Label %s not found";

  public static final String TICKET_ASSOCIATION_EXISTS =
      "Association between tickets %s and %s already exists";

  public static final String ID_NOT_FOUND = "ID %s not found";

  private ErrorMessages() {}
}
