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
