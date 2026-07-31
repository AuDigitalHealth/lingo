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

import { describe, expect, it } from 'vitest';
import { validator } from './validator.ts';

// isValid caches compiled AJV validators (per #1932 — it previously recompiled
// the schema on every call). These tests pin the cache to correct behaviour:
// repeated and equal-but-distinct schemas must validate consistently, and
// different schemas must not collide.
describe('validator.isValid compile cache', () => {
  const stringSchema = { type: 'string' };
  const objectSchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  };

  it('validates consistently across repeated calls with the same schema object', () => {
    expect(validator.isValid(stringSchema, 'hello', {})).toBe(true);
    expect(validator.isValid(stringSchema, 'world', {})).toBe(true);
    expect(validator.isValid(stringSchema, 42, {})).toBe(false);
  });

  it('validates consistently for equal schemas arriving as fresh objects', () => {
    expect(validator.isValid({ ...objectSchema }, { name: 'a' }, {})).toBe(
      true,
    );
    expect(validator.isValid({ ...objectSchema }, {}, {})).toBe(false);
  });

  it('does not collide cached validators across different schemas', () => {
    const numberSchema = { type: 'number' };
    expect(validator.isValid(stringSchema, 'text', {})).toBe(true);
    expect(validator.isValid(numberSchema, 'text', {})).toBe(false);
    expect(validator.isValid(numberSchema, 7, {})).toBe(true);
    expect(validator.isValid(stringSchema, 7, {})).toBe(false);
  });

  it('ignores a stale $id on the schema when compiling', () => {
    const withId = { ...stringSchema, $id: 'stale-id' };
    expect(validator.isValid(withId, 'ok', {})).toBe(true);
  });
});
