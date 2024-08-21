package com.csiro.snomio.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class BigDecimalFormatter {

  public static String formatBigDecimal(BigDecimal number, int scale) {
    // Set the scale with RoundingMode.HALF_UP
    BigDecimal scaledNumber = number.setScale(scale, RoundingMode.HALF_UP);

    // Convert to String
    String formattedNumber = scaledNumber.toPlainString();

    // Remove trailing zeros after the decimal point
    if (formattedNumber.contains(".")) {
      formattedNumber = formattedNumber.replaceAll("0*$", "").replaceAll("\\.$", ".0");
    }

    return formattedNumber;
  }
}
