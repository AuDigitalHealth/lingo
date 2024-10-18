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
package au.gov.digitalhealth.tickets.helper;

import au.gov.digitalhealth.tickets.models.Label;
import au.gov.digitalhealth.tickets.models.Ticket;

public class TicketUtils {

  public static final String DUPLICATE_LABEL_NAME = "Duplicate";

  private TicketUtils() {}

  public static boolean isTicketDuplicate(Ticket ticket) {
    for (Label label : ticket.getLabels()) {
      if (DUPLICATE_LABEL_NAME.equals(label.getName())) {
        return true;
      }
    }
    return false;
  }
}
