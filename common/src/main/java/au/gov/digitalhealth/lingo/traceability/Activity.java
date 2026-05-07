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
package au.gov.digitalhealth.lingo.traceability;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * One activity returned by the SNOMED CT traceability service. Only the fields used by Lingo are
 * mapped; everything else is ignored so we don't have to track upstream additions.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Activity(
    String id,
    String username,
    String branch,
    String highestPromotedBranch,
    OffsetDateTime commitDate,
    String activityType,
    List<ConceptChange> conceptChanges) {}
