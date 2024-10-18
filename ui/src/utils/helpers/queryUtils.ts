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

import { JiraUser } from '../../types/JiraUserResponse';
import { findLikeJiraUserByDisplayedNameFromList } from './userUtils';

export function validateQueryParams(queryString: string): boolean {
  if (queryString.includes('undefined')) return false;
  // Remove the leading "?" if present
  if (queryString.startsWith('?')) {
    queryString = queryString.slice(1);
  }

  // Split the query string into key-value pairs
  const queryParams = queryString.split('&');

  // Iterate through each key-value pair and check for empty values
  for (const param of queryParams) {
    const [key, value] = param.split('=');

    // Check if the key or value is missing or if the value is empty
    if (!key || !value || value.trim() === '') {
      return false; // Invalid query parameter found
    }
  }

  return true; // All query parameters are valid
}

export function createQueryStringFromKeyValue(
  keyValue: string,
  jiraUsers: JiraUser[],
): string {
  const keyValuePairs = keyValue.split(', ');
  const queryString = keyValuePairs
    .map(pair => {
      // eslint-disable-next-line prefer-const
      let [key, value] = pair.split(':');
      const lowerCaseKey = key.toLowerCase();
      const translatedKey = mappedQueryValues[lowerCaseKey];

      const encodedKey = encodeURIComponent(
        translatedKey !== undefined ? translatedKey : key,
      );
      // for when there is no key value pair - just search by title
      if (
        translatedKey === undefined &&
        value === undefined &&
        !pair.includes(':')
      ) {
        const encodedValue = encodeURIComponent(key);
        return `title=${encodedValue},comments.text=${encodedValue}`;
        // all other types of searches, a key value pair is entered
      } else {
        if (key === 'assignee') {
          const user = findLikeJiraUserByDisplayedNameFromList(
            value,
            jiraUsers,
          );
          if (user) {
            value = user.name;
          }
        }
        const encodedValue = encodeURIComponent(value);
        return `${encodedKey}=${encodedValue}`;
      }
    })
    .join('&');

  if (!queryString) {
    return ''; // Return an empty string if the input string is empty
  }

  return `?${queryString}`;
}

interface Map {
  [key: string]: string | undefined;
}

// expand on this map, for when they want to add other things or other specific terms that they want to query by.
const mappedQueryValues: Map = {
  iteration: 'iteration.name',
  priority: 'priorityBucket.name',
  status: 'state.label',
  label: 'labels.name',
  labels: 'labels.name',
  schedule: 'schedule.name',
  task: 'taskAssociation.taskId',
  comment: 'comments.text',
};
