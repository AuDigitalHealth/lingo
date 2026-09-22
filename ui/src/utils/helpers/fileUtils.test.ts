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
import { getFileNameFromContentDisposition } from './fileUtils';

describe('getFileNameFromContentDisposition', () => {
  it('reads a plain ASCII filename', () => {
    expect(
      getFileNameFromContentDisposition('attachment; filename="Report.pdf"'),
    ).toBe('Report.pdf');
  });

  it('prefers filename* over the ISO-8859-1 filename parameter', () => {
    // What the server now sends for an attachment named with bullets. The plain parameter has
    // them substituted, because a header value carrying them is dropped before it reaches us.
    const header =
      'attachment; filename="CMI _ Green Weekend - Jungle Cake _ 15g.pdf"; ' +
      "filename*=UTF-8''CMI%20%E2%80%A2%20Green%20Weekend%20-%20Jungle%20Cake%20%E2%80%A2%2015g.pdf";

    expect(getFileNameFromContentDisposition(header)).toBe(
      'CMI • Green Weekend - Jungle Cake • 15g.pdf',
    );
  });

  it('decodes an em dash and a curly quote from filename*', () => {
    expect(
      getFileNameFromContentDisposition(
        'attachment; filename="Em_Dash.pdf"; filename*=UTF-8\'\'Em%E2%80%94Dash.pdf',
      ),
    ).toBe('Em—Dash.pdf');
    expect(
      getFileNameFromContentDisposition(
        'attachment; filename="Curly _Quote_.pdf"; filename*=UTF-8\'\'Curly%20%E2%80%99Quote%E2%80%99.pdf',
      ),
    ).toBe('Curly ’Quote’.pdf');
  });

  it('decodes an ISO-8859-1 filename*', () => {
    expect(
      getFileNameFromContentDisposition(
        "attachment; filename*=ISO-8859-1''Caf%E9.pdf",
      ),
    ).toBe('Café.pdf');
  });

  it('unescapes a quote inside a quoted filename', () => {
    expect(
      getFileNameFromContentDisposition(
        'attachment; filename="Quote\\"Inside.pdf"',
      ),
    ).toBe('Quote"Inside.pdf');
  });

  it('reads an unquoted filename', () => {
    expect(
      getFileNameFromContentDisposition('attachment; filename=Report.pdf'),
    ).toBe('Report.pdf');
  });

  it('falls back to the plain filename when filename* is malformed', () => {
    expect(
      getFileNameFromContentDisposition(
        'attachment; filename="Report.pdf"; filename*=UTF-8\'\'%E0%A4%A.pdf',
      ),
    ).toBe('Report.pdf');
  });

  it('returns an empty string when there is no header or no filename', () => {
    expect(getFileNameFromContentDisposition('')).toBe('');
    expect(
      getFileNameFromContentDisposition(undefined as unknown as string),
    ).toBe('');
    expect(getFileNameFromContentDisposition('attachment')).toBe('');
  });
});
