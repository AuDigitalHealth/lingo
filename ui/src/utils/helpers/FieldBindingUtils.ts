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

import { FieldBindings } from '../../types/FieldBindings.ts';

export function getValueFromFieldBindings(
  fieldBinding: FieldBindings,
  key: string,
) {
  return fieldBinding.bindingsMap.get(key) as string;
}

/**
 * Handling multi key,value pairs eg:"NOT_TRIGGERED:Not Triggered,FAILED:FAILED,PENDING:PENDING"
 * @param fieldBinding
 * @param key
 */
export function getAllKeyValueMapForTheKey(
  fieldBinding: FieldBindings,
  key: string,
) {
  const keyValuePairs = getValueFromFieldBindings(fieldBinding, key).split(',');

  const keyValueMap = new Map();

  keyValuePairs.forEach(pair => {
    // Check if the pair contains a colon to detect wrong props
    if (!pair.includes(':')) {
      console.error(
        `Invalid config values for'${key}' , pair: '${pair}'. Expected format is 'key:value'.`,
      );
    } else {
      const [key, value] = pair.split(':');
      keyValueMap.set(key.trim(), value.trim()); // Trim whitespace from both key and value
    }
  });

  return keyValueMap;
}
