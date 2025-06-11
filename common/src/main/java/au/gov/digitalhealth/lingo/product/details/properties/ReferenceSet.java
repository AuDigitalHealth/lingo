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
package au.gov.digitalhealth.lingo.product.details.properties;

import au.csiro.snowstorm_client.model.SnowstormReferenceSetMember;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeName;
import java.io.Serializable;
import java.util.Collection;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonTypeName("referenceSet")
public class ReferenceSet extends NonDefiningBase implements Serializable {
  public ReferenceSet() {
    this.setType(PropertyType.REFERENCE_SET);
  }

  public ReferenceSet(
      SnowstormReferenceSetMember r, ReferenceSetDefinition referenceSetDefinition) {
    this.setIdentifierScheme(referenceSetDefinition.getName());
    this.setIdentifier(r.getRefsetId());
    this.setTitle(referenceSetDefinition.getTitle());
    this.setDescription(referenceSetDefinition.getDescription());
    this.setType(PropertyType.REFERENCE_SET);
  }

  public ReferenceSet(
      SnowstormReferenceSetMemberViewComponent r, ReferenceSetDefinition referenceSetDefinition) {
    this.setIdentifierScheme(referenceSetDefinition.getName());
    this.setIdentifier(r.getRefsetId());
    this.setTitle(referenceSetDefinition.getTitle());
    this.setDescription(referenceSetDefinition.getDescription());
    this.setType(PropertyType.REFERENCE_SET);
  }

  public static Collection<ReferenceSet> filter(Collection<NonDefiningBase> properties) {
    return properties.stream()
        .filter(p -> p.getType().equals(PropertyType.REFERENCE_SET))
        .map(p -> (ReferenceSet) p)
        .toList();
  }
}
