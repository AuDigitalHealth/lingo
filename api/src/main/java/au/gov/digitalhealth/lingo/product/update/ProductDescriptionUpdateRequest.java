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
package au.gov.digitalhealth.lingo.product.update;

import au.csiro.snowstorm_client.model.SnowstormDescription;
import jakarta.validation.Valid;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Valid
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDescriptionUpdateRequest implements Serializable {

  Set<SnowstormDescription> descriptions;

  public boolean areDescriptionsModified(Set<SnowstormDescription> existingDescriptions) {

    Set<SnowstormDescription> currentDescriptionsCopy = new HashSet<>(descriptions);
    Set<SnowstormDescription> existingDescriptionsCopy = new HashSet<>(existingDescriptions);

    for (SnowstormDescription currentDesc : currentDescriptionsCopy) {
      boolean foundMatchingDescription = false;
      for (SnowstormDescription existingDesc : existingDescriptionsCopy) {
        if (Objects.equals(currentDesc.getDescriptionId(), existingDesc.getDescriptionId())) {
          foundMatchingDescription = true;

          if (!currentDesc.equals(existingDesc)) {
            return true;
          }

          existingDescriptionsCopy.remove(existingDesc);
          break;
        }
      }
      if (!foundMatchingDescription) {
        return true;
      }
    }

    if (!existingDescriptionsCopy.isEmpty()) {
      return true;
    }

    return false;
  }
}
