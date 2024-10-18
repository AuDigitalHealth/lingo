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
  LabelType,
  Ticket,
} from '../../../types/tickets/ticket';

export function mapToLabelOptions(labelTypes: LabelType[]) {
  const labelList = labelTypes.map(label => {
    return { value: label.name, label: label.name };
  });
  return labelList;
}

export function labelExistsOnTicket(ticket: Ticket, label: LabelType): boolean {
  let exists = false;
  ticket.labels.forEach(internalLabel => {
    if (internalLabel.id === label.id) {
      exists = true;
    }
  });
  return exists;
}

export function externalRequestorExistsOnTicket(
  ticket: Ticket,
  inputExternalRequestor: ExternalRequestor,
): boolean {
  let exists = false;
  ticket.externalRequestors.forEach(externalRequestor => {
    if (externalRequestor.id === inputExternalRequestor.id) {
      exists = true;
    }
  });
  return exists;
}

export function getLabelByName(
  labelName: string,
  labels: LabelType[],
): LabelType | undefined {
  return labels.find(labelType => {
    return labelType.name === labelName;
  });
}
