package com.csiro.snomio.util;

import static com.csiro.snomio.util.AmtConstants.CONTAINS_DEVICE;
import static com.csiro.snomio.util.AmtConstants.CONTAINS_PACKAGED_CD;
import static com.csiro.snomio.util.AmtConstants.CONTAINS_PACKAGED_DEVICE;
import static com.csiro.snomio.util.SnomedConstants.CONTAINS_CD;
import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;
import static com.csiro.snomio.util.SnowstormDtoUtil.getSingleAxiom;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.product.details.Quantity;
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
