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
package au.gov.digitalhealth.tickets.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TicketNumberGenerator {
  @Value("${snomio.ticket.number.prefix}")
  private String prefix;

  @Value("${snomio.ticket.number.digits}")
  private int digits;

  // TODO currently using data base id to generate unique ticket number
  @SuppressWarnings("java:S3457")
  public String generateTicketNumber(Long id) {
    String formattedId = String.format("%0" + digits + "d", id);
    return prefix + "-" + formattedId;
  }
}
