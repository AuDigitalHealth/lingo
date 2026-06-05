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
package au.gov.digitalhealth.lingo.product.namegenerator;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.annotation.Nullable;

public enum StrengthFormat {
  INFERENCE("inference"),
  SIMPLE("simple"),
  RATIO("ratio"),
  PERCENTAGE("percentage");

  private final String value;

  StrengthFormat(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  /**
   * @param value lowercase wire form (one of {@code inference}, {@code simple}, {@code ratio},
   *     {@code percentage})
   * @return the matching enum constant, or {@code null} when {@code value} is null
   * @throws IllegalArgumentException when {@code value} is non-null and not a recognised wire form.
   *     Used by Jackson; surfaces as HTTP 400 via {@code GlobalExceptionHandler}.
   */
  @JsonCreator
  @Nullable
  public static StrengthFormat fromString(@Nullable String value) {
    if (value == null) {
      return null;
    }
    for (StrengthFormat format : StrengthFormat.values()) {
      if (format.value.equals(value)) {
        return format;
      }
    }
    throw new IllegalArgumentException(
        "Unknown StrengthFormat value: '"
            + value
            + "'. Expected one of: inference, simple, ratio, percentage");
  }
}
