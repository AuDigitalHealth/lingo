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

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketMetadata {

  private String name;
  private String description;
  private String descriptionMarkup;

  /**
   * The submission's own details as an HTML table — type, product, submitter, details, business
   * reason — as distinct from the register-derived description.
   *
   * <p>A composing caller's description is the ticket's content and replaces the ticket's own, so
   * this is carried separately and put where it used to appear: the description of a new ticket,
   * and a comment on one that already exists. Without it an interactive submission leaves no record
   * of who asked for the work or why.
   *
   * <p>Null from a caller that composed nothing — its description is already the submission's own
   * and is handled as before.
   */
  private String submissionDetails;

  private List<ExternalRequestorRequest> externalRequestors;
  private String dedupeKey;
  private List<String> labels;

  // ── Composed ticket content ────────────────────────────────────────────────
  //
  // A caller that has already composed the ticket sends its whole content, not just a name. Before
  // these fields existed, only the title, description and labels could cross, so a caller that had
  // resolved the state, schedule, priority and register snapshot had to create the ticket and then
  // patch it — two writes, and a window in which the ticket existed with none of that content.
  //
  // All are optional. A caller submitting a bare identifier leaves them null and the previous
  // behaviour applies unchanged.

  /** Schedule name, e.g. {@code S4}. */
  private String schedule;

  /** State label the caller resolved, e.g. {@code To Do} or {@code Reopened}. */
  private String stateLabel;

  /**
   * Labels the caller determined no longer apply — for instance a black-triangle label on an entry
   * that has left the scheme. Without this, labels could only ever be added, so a label derived
   * from register content could never be withdrawn when that content changed.
   */
  private List<String> labelsToRemove;

  /** Priority bucket name the caller resolved. */
  private String priorityBucket;

  /**
   * The register entry as the caller observed it, stored verbatim on the ticket so a later run can
   * tell whether the entry has since changed. Held as JSON rather than a typed field because its
   * shape is the register's, not this application's.
   */
  private JsonNode registerSnapshot;

  /**
   * Whether the composed title differs from what the ticket already holds. Lets an update leave a
   * title alone when the register value behind it did not change, rather than restamping identical
   * text — or overwriting an edit a person made.
   */
  private boolean titleChanged;

  /** As {@link #titleChanged}, for the description. */
  private boolean descriptionChanged;

  /**
   * Additional field values the caller derived, keyed by field type name — for ARTG tickets {@code
   * StartDate}, {@code EffectiveDate}, {@code ARTGID} and {@code InactiveDate}.
   *
   * <p>Keyed by name because which field types exist is this application's configuration. A name
   * with no matching type is ignored rather than created, so a caller cannot invent field types.
   */
  private Map<String, String> additionalFields;

  @JsonIgnore
  public String getResolvedDescription() {
    if (descriptionMarkup != null && !descriptionMarkup.isEmpty()) {
      return descriptionMarkup;
    }
    if (description != null && !description.isEmpty()) {
      return description;
    }
    return null;
  }
}
