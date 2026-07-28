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
import { isApplicationProblem } from './ProblemDetail';

describe('isApplicationProblem', () => {
  it('recognises a deliberate backend problem carrying a detail, even at 500', () => {
    // The CUST1730375 / NMPC-001949 $calculate failure: a well-formed backend problem with a
    // useful message that must reach the user instead of the generic crash-report path.
    const tooManyConcepts = {
      type: 'http://lingo.csiro.au/problem/too-many-concepts',
      title: 'Too many concepts',
      status: 500,
      detail: "Too many concepts found for ecl '...' limit 1 total 2",
      instance: '/api/MAIN/medications/product/$calculate',
    };

    expect(isApplicationProblem(tooManyConcepts)).toBe(true);
  });

  it('recognises a 400 application problem', () => {
    const validation = {
      type: 'http://lingo.csiro.au/problem/atomic-data-validation-problem',
      title: 'Atomic data validation problem',
      status: 400,
      detail: 'Product name must be populated',
      instance: '/api/MAIN/medications/product/$calculate',
    };

    expect(isApplicationProblem(validation)).toBe(true);
  });

  it('rejects a raw framework 500 with no problem type', () => {
    // Spring's default error shape - genuinely unexpected, should still reach Sentry, not a snackbar.
    const springError = {
      timestamp: '2026-07-27T00:00:00.000+00:00',
      status: 500,
      error: 'Internal Server Error',
      path: '/api/MAIN/medications/product/$calculate',
    };

    expect(isApplicationProblem(springError)).toBe(false);
  });

  it('rejects a problem from a foreign type namespace', () => {
    const foreign = {
      type: 'about:blank',
      title: 'Error',
      status: 500,
      detail: 'something',
      instance: '/api/x',
    };

    expect(isApplicationProblem(foreign)).toBe(false);
  });

  it('rejects an application problem with a blank detail', () => {
    const blank = {
      type: 'http://lingo.csiro.au/problem/lingo-problem',
      title: 'Error',
      status: 500,
      detail: '   ',
      instance: '/api/x',
    };

    expect(isApplicationProblem(blank)).toBe(false);
  });

  it('rejects null / undefined', () => {
    expect(isApplicationProblem(null)).toBeFalsy();
    expect(isApplicationProblem(undefined)).toBeFalsy();
  });
});
