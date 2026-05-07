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
import java.util.List;

/** Page wrapper around a list of {@link Activity} entries from the traceability service. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PageActivity(
    List<Activity> content, Integer totalPages, Long totalElements, Integer number, Boolean last) {}
