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
package au.gov.digitalhealth.lingo.promotion;

import jakarta.annotation.Nullable;
import java.util.Objects;

public record DanglingNonDefiningRelationship(
    String relationshipId,
    String typeId,
    @Nullable String typePt,
    String sourceId,
    @Nullable String sourcePt,
    ConceptStatus sourceStatus,
    String destinationId,
    @Nullable String destinationPt,
    ConceptStatus destinationStatus,
    boolean released) {

  public DanglingNonDefiningRelationship {
    Objects.requireNonNull(relationshipId, "relationshipId");
    Objects.requireNonNull(typeId, "typeId");
    Objects.requireNonNull(sourceId, "sourceId");
    Objects.requireNonNull(destinationId, "destinationId");
    Objects.requireNonNull(sourceStatus, "sourceStatus");
    Objects.requireNonNull(destinationStatus, "destinationStatus");
    if (sourceStatus == ConceptStatus.ACTIVE && destinationStatus == ConceptStatus.ACTIVE) {
      throw new IllegalArgumentException(
          "DanglingNonDefiningRelationship requires at least one non-ACTIVE endpoint");
    }
  }
}
