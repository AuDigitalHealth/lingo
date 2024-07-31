import { ExternalRequestor } from '../../../types/tickets/ticket';

export const getExternalRequestorByName = (
  externalRequestorName: string,
  externalRequestors: ExternalRequestor[],
) => {
  return externalRequestors.find(externalRequestor => {
    return externalRequestor.name === externalRequestorName;
  });
};
