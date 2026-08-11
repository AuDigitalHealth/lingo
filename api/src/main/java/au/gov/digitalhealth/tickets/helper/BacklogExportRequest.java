/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.helper;

import java.io.Serializable;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BacklogExportRequest implements Serializable {

  private SearchConditionBody searchConditionBody;
  private List<String> columns;
  // Names of additional field types to include as columns (e.g. "ARTGID"). One column per name,
  // value pulled from the ticket's matching additional field value.
  private List<String> additionalFieldColumns;
  private List<String> externalRequestorColumns;
  private boolean erDateRequested;
  private boolean erDateAdded;
  // When true, emit positional "External Requester N" / "External Requester N Date Requested"
  // column pairs, one per external requestor that has a requested date (name as cell data).
  private boolean erWithDateRequested;
  // Explicit, user-defined order of the exported columns by column key. When non-empty, the
  // assembled columns are stably reordered to follow this list; keys not listed (e.g. dynamic
  // positional requestor columns) keep their relative order and are appended after.
  private List<String> columnOrder;
}
