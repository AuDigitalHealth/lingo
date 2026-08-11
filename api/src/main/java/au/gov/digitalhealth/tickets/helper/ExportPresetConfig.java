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

/**
 * The saved column/option selection of a backlog export. Persisted as the JSON body of an {@link
 * au.gov.digitalhealth.tickets.models.ExportPreset}. This intentionally does not include the
 * backlog search query (that is saved separately as a ticket filter) — a preset only captures how
 * the export is shaped.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportPresetConfig implements Serializable {

  private List<String> columns;
  private List<String> additionalFieldColumns;
  private List<String> externalRequestorColumns;
  private boolean erDateRequested;
  private boolean erDateAdded;
  private boolean erWithDateRequested;
  // Explicit, user-defined order of the exported CSV columns (backend column keys).
  private List<String> columnOrder;
}
