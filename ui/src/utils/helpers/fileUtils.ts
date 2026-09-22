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
 * Reads the filename out of a Content-Disposition header.
 *
 * Prefers the RFC 5987 `filename*` parameter, which carries the name percent-encoded in an
 * explicit charset. The plain `filename` parameter can only hold ISO-8859-1, so anything outside
 * that range reaches us mangled - the server substitutes those characters before sending, because
 * a header value containing them is dropped in transit. `filename*` is the only parameter that
 * survives a name containing a bullet, em dash, curly quote or non-Latin script intact.
 */
export function getFileNameFromContentDisposition(
  contentDisposition: string,
): string {
  if (!contentDisposition) {
    return '';
  }

  const extended = /filename\*\s*=\s*([^']*)'([^']*)'([^;]+)/i.exec(
    contentDisposition,
  );
  if (extended) {
    const decoded = decodeExtendedFilename(extended[3], extended[1]);
    if (decoded) {
      return decoded;
    }
  }

  const quoted = /filename\s*=\s*"((?:[^"\\]|\\.)*)"/i.exec(contentDisposition);
  if (quoted) {
    // Within a quoted string a backslash escapes the character after it.
    return quoted[1].replace(/\\(.)/g, '$1');
  }

  const bare = /filename\s*=\s*([^;]+)/i.exec(contentDisposition);
  return bare ? bare[1].trim() : '';
}

/**
 * Percent-decodes an RFC 5987 value. Returns undefined when the value is not decodable, so the
 * caller can fall back to the plain `filename` parameter rather than surface a broken name.
 */
function decodeExtendedFilename(
  value: string,
  charset: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    if (charset.toLowerCase() === 'iso-8859-1') {
      return trimmed.replace(/%([0-9a-f]{2})/gi, (_, hex: string) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
    }
    return decodeURIComponent(trimmed);
  } catch {
    // Malformed percent-encoding - fall back to the plain filename parameter.
    return undefined;
  }
}
