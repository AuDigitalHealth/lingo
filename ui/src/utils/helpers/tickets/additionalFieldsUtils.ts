import { AdditionalFieldType } from '../../../types/tickets/ticket';

export const sortAdditionalFields = (
  unsortedFields: AdditionalFieldType[] | null,
): AdditionalFieldType[] | undefined => {
  if (unsortedFields === null) {
    return [];
  }
  let sortedFields = [] as AdditionalFieldType[];

  const schedule = unsortedFields.find(field => {
    return field.name === 'Schedule';
  });

  const artgid = unsortedFields.find(field => {
    return field.name === 'ARTGID';
  });

  const startDate = unsortedFields.find(field => {
    return field.name === 'StartDate';
  });

  const effectiveDate = unsortedFields.find(field => {
    return field.name === 'EffectiveDate';
  });

  const remainingFields = unsortedFields.filter(field => {
    return !(
      field.name === 'Schedule' ||
      field.name === 'ARTGID' ||
      field.name === 'StartDate' ||
      field.name === 'EffectiveDate'
    );
  });

  if (schedule) {
    sortedFields.push(schedule);
  }
  if (artgid) {
    sortedFields.push(artgid);
  }
  if (startDate) {
    sortedFields.push(startDate);
  }
  if (effectiveDate) {
    sortedFields.push(effectiveDate);
  }
  if (remainingFields) {
    sortedFields = sortedFields.concat(remainingFields);
  }

  return sortedFields;
};
