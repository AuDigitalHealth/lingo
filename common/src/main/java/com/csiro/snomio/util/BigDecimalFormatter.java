package com.csiro.snomio.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class BigDecimalFormatter {

  private BigDecimalFormatter() {}

  public static String formatBigDecimal(BigDecimal number, int scale) {
    // Set the scale with RoundingMode.HALF_UP
    BigDecimal scaledNumber = number.setScale(scale, RoundingMode.HALF_UP);

    // Convert to String
    String formattedNumber = scaledNumber.toPlainString();

    // Remove trailing zeros after the decimal point
    if (formattedNumber.contains(".")) {
      int endIndex = formattedNumber.length();
      while (endIndex > 0 && formattedNumber.charAt(endIndex - 1) == '0') {
        endIndex--;
      }
      if (formattedNumber.charAt(endIndex - 1) == '.') {
        endIndex++;
      }
      formattedNumber = formattedNumber.substring(0, endIndex);
    }

    return formattedNumber;
  }
}
