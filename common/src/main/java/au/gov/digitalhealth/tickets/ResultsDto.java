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
package au.gov.digitalhealth.tickets;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor // Needs for message deserialisation
public class ResultsDto extends RabbitMessage {
  int processedArtgIds;
  int newTickets;
  int updatedTickets;
  int duplicatedTickets;
  int toBeSuspendedTickets;
  String finishedTime;

  public ResultsDto(
      String correlationId,
      int processedArtgIds,
      int newTickets,
      int updatedTickets,
      int duplicatedTickets,
      int toBeSuspendedTickets,
      String finishedTime) {
    super(correlationId); // Initialize the parent class field
    this.processedArtgIds = processedArtgIds;
    this.newTickets = newTickets;
    this.updatedTickets = updatedTickets;
    this.duplicatedTickets = duplicatedTickets;
    this.toBeSuspendedTickets = toBeSuspendedTickets;
    this.finishedTime = finishedTime;
  }
}
