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
