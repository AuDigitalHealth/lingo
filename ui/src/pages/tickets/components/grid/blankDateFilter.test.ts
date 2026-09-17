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
import { FilterMatchMode } from 'primereact/api';
import { generateSearchConditions } from './GenerateSearchConditions';
import { generateFilterConditions } from './GenerateFilterConditions';
import {
  BLANK_FILTER_VALUE,
  DATE_IS_BLANK,
  DATE_IS_NOT_BLANK,
} from './helpers/blankDateFilter';
import {
  LazyTicketTableState,
  generateDefaultTicketTableLazyState,
} from '../../../../types/tickets/table';
import { SearchConditionBody } from '../../../../types/tickets/search';

const lazyStateWithDueDate = (
  matchMode: string,
  value: Date | Date[] | boolean | null,
): LazyTicketTableState => {
  const lazyState = generateDefaultTicketTableLazyState();
  lazyState.filters.dueDate = { matchMode: matchMode, value: value };
  return lazyState;
};

const rehydrate = (body: SearchConditionBody) =>
  generateFilterConditions(body, [], [], [], [], [], [], [], []);

describe('generateSearchConditions - due date', () => {
  it('asks for tickets that have a due date without sending a date', () => {
    const body = generateSearchConditions(
      lazyStateWithDueDate(DATE_IS_NOT_BLANK, BLANK_FILTER_VALUE),
      '',
    );

    expect(body.searchConditions).toEqual([
      { key: 'duedate', operation: 'isNotNull', condition: 'and' },
    ]);
  });

  it('asks for tickets that have no due date', () => {
    const body = generateSearchConditions(
      lazyStateWithDueDate(DATE_IS_BLANK, BLANK_FILTER_VALUE),
      '',
    );

    expect(body.searchConditions).toEqual([
      { key: 'duedate', operation: 'isNull', condition: 'and' },
    ]);
  });

  it('still sends the date for the date-comparing modes', () => {
    const due = new Date(Date.UTC(2026, 8, 15, 2, 0, 0));
    const body = generateSearchConditions(
      lazyStateWithDueDate(FilterMatchMode.DATE_BEFORE, due),
      '',
    );

    expect(body.searchConditions).toEqual([
      {
        key: 'duedate',
        operation: '<=',
        condition: 'and',
        value: '2026-09-15T02:00:00.000Z',
      },
    ]);
  });

  it('sends both ends of a date range', () => {
    const from = new Date(Date.UTC(2026, 8, 1, 2, 0, 0));
    const to = new Date(Date.UTC(2026, 8, 30, 2, 0, 0));
    const body = generateSearchConditions(
      lazyStateWithDueDate(FilterMatchMode.DATE_IS, [from, to]),
      '',
    );

    expect(body.searchConditions[0].value).toBe(
      '2026-09-01T02:00:00.000Z-2026-09-30T02:00:00.000Z',
    );
  });

  it('sends nothing when a date-comparing mode has no date yet', () => {
    const body = generateSearchConditions(
      lazyStateWithDueDate(FilterMatchMode.DATE_IS, null),
      '',
    );

    expect(body.searchConditions).toEqual([]);
  });
});

describe('generateFilterConditions - due date', () => {
  it('restores a saved "is not blank" filter', () => {
    const filters = rehydrate({
      searchConditions: [
        { key: 'duedate', operation: 'isNotNull', condition: 'and' },
      ],
    });

    expect(filters.dueDate?.matchMode).toBe(DATE_IS_NOT_BLANK);
    expect(filters.dueDate?.value).toBe(BLANK_FILTER_VALUE);
  });

  it('restores a saved "is blank" filter', () => {
    const filters = rehydrate({
      searchConditions: [
        { key: 'duedate', operation: 'isNull', condition: 'and' },
      ],
    });

    expect(filters.dueDate?.matchMode).toBe(DATE_IS_BLANK);
  });

  it('restores a saved due date comparison', () => {
    const filters = rehydrate({
      searchConditions: [
        {
          key: 'duedate',
          operation: '>=',
          condition: 'and',
          value: '2026-09-15T02:00:00.000Z',
        },
      ],
    });

    expect(filters.dueDate?.matchMode).toBe(FilterMatchMode.DATE_AFTER);
    expect((filters.dueDate?.value as Date).toISOString()).toBe(
      '2026-09-15T02:00:00.000Z',
    );
  });

  it('restores both ends of a saved date range', () => {
    const filters = rehydrate({
      searchConditions: [
        {
          key: 'duedate',
          operation: '=',
          condition: 'and',
          value: '2026-09-01T02:00:00.000Z-2026-09-30T02:00:00.000Z',
        },
      ],
    });

    const value = filters.dueDate?.value as Date[];
    expect(value).toHaveLength(2);
    expect(value[0].toISOString()).toBe('2026-09-01T02:00:00.000Z');
    expect(value[1].toISOString()).toBe('2026-09-30T02:00:00.000Z');
  });

  it('restores a day-first date left by an older saved search', () => {
    const filters = rehydrate({
      searchConditions: [
        { key: 'created', operation: '=', condition: 'and', value: '13/10/23' },
      ],
    });

    const value = filters.created?.value as Date;
    expect(value.getFullYear()).toBe(2023);
    expect(value.getMonth()).toBe(9);
    expect(value.getDate()).toBe(13);
  });
});

describe('due date filter round trip', () => {
  it.each([DATE_IS_NOT_BLANK, DATE_IS_BLANK])(
    'survives being saved and loaded again: %s',
    matchMode => {
      const body = generateSearchConditions(
        lazyStateWithDueDate(matchMode, BLANK_FILTER_VALUE),
        '',
      );

      const reloaded = rehydrate(body);
      const lazyState = generateDefaultTicketTableLazyState();
      lazyState.filters = reloaded;

      expect(generateSearchConditions(lazyState, '').searchConditions).toEqual(
        body.searchConditions,
      );
    },
  );
});
