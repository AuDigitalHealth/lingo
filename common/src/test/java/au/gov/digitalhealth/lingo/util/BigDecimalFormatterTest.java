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
    "123.000, 3, 123.0",
    "123.00000, 3, 123.0",
    "123.00001, 3, 123.0",
    "123.0000100, 3, 123.0",
    "123.00100, 3, 123.001",
    "123.0100, 3, 123.01",
    "123.450000, 3, 123.45",
    "123.456789123, 0, 123",
    "123.456789123, -1, 120"
  })
  void testFormatBigDecimalNoTrim(String input, int scale, String expected) {
    BigDecimal number = new BigDecimal(input);
    assertEquals(expected, BigDecimalFormatter.formatBigDecimal(number, scale, false));
  }

  @ParameterizedTest
  @CsvSource({
    "123.456789123, 6, 123.456789",
    "123.456789, 6, 123.456789",
    "123.45, 6, 123.45",
    "123, 6, 123",
    "123.450000, 6, 123.45",
    "123.4, 6, 123.4",
    "0, 6, 0",
    "123.456789123, 3, 123.457",
    "123.456, 3, 123.456",
    "123.45, 3, 123.45",
    "123, 3, 123",
    "123.000, 3, 123",
    "123.00000, 3, 123",
    "123.00001, 3, 123",
    "123.0000100, 3, 123",
    "123.00100, 3, 123.001",
    "123.0100, 3, 123.01",
    "123.450000, 3, 123.45",
    "123.456789123, 0, 123",
    "123.456789123, -1, 120"
  })
  void testFormatBigDecimalTrim(String input, int scale, String expected) {
    BigDecimal number = new BigDecimal(input);
    assertEquals(expected, BigDecimalFormatter.formatBigDecimal(number, scale, true));
  }
}
