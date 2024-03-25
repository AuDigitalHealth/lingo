package com.csiro.snomio.util;

import static com.csiro.snomio.util.SnomedConstants.UNIT_OF_PRESENTATION;

import com.csiro.snomio.exception.ProductAtomicDataValidationProblem;
import com.csiro.snomio.product.details.Quantity;
import java.math.BigDecimal;
import java.util.Objects;

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
}
