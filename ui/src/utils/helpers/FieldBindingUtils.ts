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
