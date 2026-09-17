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

/**
 * Filtering a date column on whether it holds a date at all, rather than on which date
 * it holds. PrimeReact ships no such match mode for date columns, so the backlog adds
 * these two through a column's filterMatchModeOptions.
 */
export const DATE_IS_BLANK = 'dateIsBlank';
export const DATE_IS_NOT_BLANK = 'dateIsNotBlank';

/**
 * The operations the API understands for those modes. They carry no date, so the
 * predicate builder answers them without parsing a value.
 */
export const IS_NULL_OPERATION = 'isNull';
export const IS_NOT_NULL_OPERATION = 'isNotNull';

/**
 * The value a blank filter carries. Nothing ever reads it as a date - it is there
 * because PrimeReact treats a null-valued filter as unset, which would leave the column
 * header showing no sign that a filter is applied.
 */
export const BLANK_FILTER_VALUE = true;

export const isBlankDateMatchMode = (matchMode?: string): boolean =>
  matchMode === DATE_IS_BLANK || matchMode === DATE_IS_NOT_BLANK;

export const blankDateOperation = (matchMode?: string): string =>
  matchMode === DATE_IS_BLANK ? IS_NULL_OPERATION : IS_NOT_NULL_OPERATION;

export const blankDateMatchMode = (operation?: string): string =>
  operation === IS_NULL_OPERATION ? DATE_IS_BLANK : DATE_IS_NOT_BLANK;

export const isBlankDateOperation = (operation?: string): boolean =>
  operation === IS_NULL_OPERATION || operation === IS_NOT_NULL_OPERATION;
