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

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

// eslint-disable-next-line
export const isProblemDetail = (data: any): data is ProblemDetail => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    typeof data.title === 'string' &&
    typeof data.status === 'number' &&
    typeof data.detail === 'string' &&
    typeof data.instance === 'string'
  );
};

export const isUserReportableProblem = (
  // eslint-disable-next-line
  data: any,
): data is ProblemDetail => {
  const isPD = isProblemDetail(data);
  return (
    isPD &&
    (data.type ===
      'http://lingo.csiro.au/problem/atomic-data-validation-problem' ||
      data.type === 'http://lingo.csiro.au/problem/resource-not-found' ||
      data.type === 'http://lingo.csiro.au/problem/single-concept-ecl' ||
      data.type === 'http://lingo.csiro.au/problem/batch-failed' ||
      data.type === 'http://lingo.csiro.au/problem/model-configuration' ||
      data.type === 'http://lingo.csiro.au/problem/model-configuration' ||
      data.type ===
        'http://lingo.csiro.au/problem/atomic-data-extraction-problem')
  );
};
