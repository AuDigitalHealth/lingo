import { LabelType, Ticket } from '../../../types/tickets/ticket';

export function mapToLabelOptions(labelTypes: LabelType[]) {
  const labelList = labelTypes.map(label => {
    return { value: label.name, label: label.name };
  });
  return labelList;
}

export function labelExistsOnTicket(ticket: Ticket, label: LabelType): boolean {
  let exists = false;
  ticket['ticket-labels'].forEach(internalLabel => {
    console.log(internalLabel);
    if (internalLabel.id === label.id) {
      exists = true;
    }
  });
  return exists;
}
