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
package au.gov.digitalhealth.lingo.util;

import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_DEVICE;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_PACKAGED_CD;
import static au.gov.digitalhealth.lingo.util.AmtConstants.CONTAINS_PACKAGED_DEVICE;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.CONTAINS_CD;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.getSingleAxiom;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.Quantity;
import java.math.BigDecimal;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class ValidationUtil {

  private ValidationUtil() {
    throw new IllegalStateException("Utility class");
  }

  public static boolean isIntegerValue(BigDecimal bd) {
    return bd.stripTrailingZeros().scale() <= 0;
  }

  public static void validateQuantityValueIsOneIfUnitIsEach(Quantity quantity) {
    if (Objects.requireNonNull(quantity.getUnit().getConceptId())
            .equals(UNIT_OF_PRESENTATION.getValue())
        && !isIntegerValue(quantity.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "Quantity must be an integer if the unit is 'each', unit was "
              + SnowstormDtoUtil.getIdAndFsnTerm(quantity.getUnit()));
    }
  }

  public static void assertSingleComponentSinglePackProduct(SnowstormConcept concept) {
    SnowstormAxiom axiom = getSingleAxiom(concept);
    if (axiom.getRelationships().stream()
        .anyMatch(
            r ->
                r.getTypeId().equals(CONTAINS_PACKAGED_CD.getValue())
                    || r.getTypeId().equals(CONTAINS_PACKAGED_DEVICE.getValue()))) {
      throw new ProductAtomicDataValidationProblem(
          "Cannot get brands for multi pack product " + concept.getConceptId());
    }

    Set<SnowstormRelationship> containsProductRelationships =
        axiom.getRelationships().stream()
            .filter(r -> r.getActive() != null && r.getActive())
            .filter(
                r ->
                    r.getTypeId().equals(CONTAINS_CD.getValue())
                        || r.getTypeId().equals(CONTAINS_DEVICE.getValue()))
            .collect(Collectors.toSet());

    if (containsProductRelationships.size() != 1) {
      throw new ProductAtomicDataValidationProblem(
          "Cannot get brands for multi component product " + concept.getConceptId());
    }
  }
}
