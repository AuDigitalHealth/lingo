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

import jakarta.annotation.Nullable;
import java.util.regex.Pattern;

/**
 * Best-effort classification of an existing product's preferred term into a {@link StrengthFormat}.
 * Used during product rehydration to pre-select the user's likely strength-format preference on the
 * authoring form.
 *
 * <p>Driven by two inputs: the source PT, and a single boolean drawn from structured strength data
 * (whether any ingredient on the product carries a populated concentration strength). The
 * concentration-strength flag anchors the SIMPLE decision to concept modelling rather than a static
 * list of "real" measure-unit tokens. Presentation strengths whose denominator is a unit of
 * presentation (actuation, capsule, dose, etc.) or a time qualifier (hour, 24 hour) do not have
 * concentration strength set, so they fall through to {@link StrengthFormat#INFERENCE} regardless
 * of slashes in the PT.
 *
 * <p>The classification is heuristic: if it picks the wrong format on an edge case the user
 * overrides the radio on the form before pressing Calculate. The cost of being wrong is one click;
 * the cost of being right is invisible. Do not treat the output as a correctness guarantee.
 *
 * <p>Designed against an offline sample of NMPC AMP + VMP preferred terms (not checked into the
 * repo). The only ongoing regression suite is {@code heuristic-cases.json} under {@code
 * api/src/test/resources/strength-format/}. AMT PT conventions were not sampled — extend the
 * fixture and adjust the regexes if AMT data shows new patterns.
 */
public final class StrengthFormatHeuristic {

  private static final Pattern PERCENT_RE = Pattern.compile("\\b\\d+(?:\\.\\d+)?\\s*%");

  /**
   * Matches a ratio-shaped token: digits (optional decimal/thousands), unit letters, slash,
   * optional numeric denominator, denominator unit letters. Used only to confirm the PT contains a
   * ratio-shaped token; whether that token represents a true strength ratio is determined by {@code
   * hasConcentrationStrength}.
   *
   * <p>The denominator value is expressed as an optional group {@code (?:\d+(?:\.\d+)?\s*)?} rather
   * than the looser {@code \d*\.?\d*} — the latter contains adjacent empty-matchable digit runs
   * around an optional dot, which exposes O(n²) backtracking on long failing inputs (Sonar
   * java:S5852). The optional-group form requires at least one digit when any number is present,
   * removing the ambiguity.
   */
  private static final Pattern RATIO_RE =
      Pattern.compile(
          "\\b\\d+(?:\\.\\d+)?(?:,\\d{3})*\\s*[A-Za-z]+\\s*/\\s*(?:\\d+(?:\\.\\d+)?\\s*)?[A-Za-z]+\\b");

  private StrengthFormatHeuristic() {}

  /**
   * @param sourcePt the preferred term of the existing product concept; null returns INFERENCE
   * @param hasConcentrationStrength true iff any ingredient on the rehydrated
   *     MedicationProductDetails has {@code isIngredientConcentrationStrength()} true
   * @return PERCENTAGE if the PT contains a percent token; SIMPLE if it contains a ratio token AND
   *     concentration strength is present in the structured data; INFERENCE otherwise. {@code
   *     RATIO} is reachable only via explicit user selection on the authoring form, never by this
   *     heuristic.
   */
  public static StrengthFormat classify(
      @Nullable String sourcePt, boolean hasConcentrationStrength) {
    if (sourcePt == null) {
      return StrengthFormat.INFERENCE;
    }
    if (PERCENT_RE.matcher(sourcePt).find()) {
      return StrengthFormat.PERCENTAGE;
    }
    if (hasConcentrationStrength && RATIO_RE.matcher(sourcePt).find()) {
      return StrengthFormat.SIMPLE;
    }
    return StrengthFormat.INFERENCE;
  }
}
