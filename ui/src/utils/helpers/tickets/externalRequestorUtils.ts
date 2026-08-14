///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import {
  ExternalRequestor,
  TicketExternalRequestorDto,
} from '../../../types/tickets/ticket';

export const getExternalRequestorByName = (
  externalRequestorName: string,
  externalRequestors: ExternalRequestor[],
) => {
  return externalRequestors.find(externalRequestor => {
    return (
      externalRequestor.name.toLocaleLowerCase() ===
      externalRequestorName.toLocaleLowerCase()
    );
  });
};

/**
 * A ticket carries its external requestors as TicketExternalRequestorDto, which is keyed
 * by externalRequestorId (the id of the ExternalRequestor) rather than by its own id.
 * Selection controls hand back ExternalRequestor, so convert before adding one to a ticket.
 */
export const toTicketExternalRequestorDto = (
  externalRequestor: ExternalRequestor,
): TicketExternalRequestorDto => {
  return {
    externalRequestorId: externalRequestor.id,
    name: externalRequestor.name,
    description: externalRequestor.description,
    displayColor: externalRequestor.displayColor,
  };
};
