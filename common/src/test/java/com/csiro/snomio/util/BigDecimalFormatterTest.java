package com.csiro.snomio.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class BigDecimalFormatterTest {

  @ParameterizedTest
  @CsvSource({
    "123.456789123, 6, 123.456789",
    "123.456789, 6, 123.456789",
    "123.45, 6, 123.45",
    "123, 6, 123.0",
    "123.450000, 6, 123.45",
    "123.4, 6, 123.4",
    "0, 6, 0.0",
    "123.456789123, 3, 123.457",
    "123.456, 3, 123.456",
    "123.45, 3, 123.45",
    "123, 3, 123.0",
    "123.450000, 3, 123.45",
    "123.456789123, 0, 123",
    "123.456789123, -1, 120"
  })
  void testFormatBigDecimal(String input, int scale, String expected) {
    BigDecimal number = new BigDecimal(input);
    assertEquals(expected, BigDecimalFormatter.formatBigDecimal(number, scale));
  }
}
