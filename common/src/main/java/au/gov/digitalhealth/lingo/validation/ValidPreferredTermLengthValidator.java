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
package au.gov.digitalhealth.lingo.validation;

import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import jakarta.annotation.PostConstruct;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ValidPreferredTermLengthValidator
    implements ConstraintValidator<ValidPreferredTermLength, NewConceptDetails> {

  private static final Logger log =
      LoggerFactory.getLogger(ValidPreferredTermLengthValidator.class);

  private static final int DEFAULT_MAX_LENGTH = 4096;

  @Autowired private FieldBindingConfiguration fieldBindingConfiguration;

  @Value("${ihtsdo.ap.defaultBranch}")
  private String defaultBranch;

  @Autowired private Models models;

  @Getter private int resolvedMaxLength = DEFAULT_MAX_LENGTH;

  @PostConstruct
  private void init() {
    String preferredTermMaxLengthConfig = fieldBindingConfiguration.getPreferredTermMaxLength();
    if (preferredTermMaxLengthConfig == null || preferredTermMaxLengthConfig.isBlank()) {
      return;
    }

    if (!preferredTermMaxLengthConfig.contains(":")) {
      resolvedMaxLength = Integer.parseInt(preferredTermMaxLengthConfig.trim());
      log.info("Preferred term max length configured: {}", resolvedMaxLength);
      return;
    }

    Map<String, Integer> refsetMaxLengths = new HashMap<>();
    Arrays.stream(preferredTermMaxLengthConfig.split(","))
        .map(pair -> pair.split(":"))
        .filter(parts -> parts.length == 2)
        .forEach(parts -> refsetMaxLengths.put(parts[0].trim(), Integer.parseInt(parts[1].trim())));

    Set<String> preferredRefsets =
        models.getModelConfiguration(defaultBranch.replace("/", "|")).getPreferredLanguageRefsets();

    resolvedMaxLength =
        preferredRefsets.stream()
            .mapToInt(code -> refsetMaxLengths.getOrDefault(code, DEFAULT_MAX_LENGTH))
            .findAny()
            .orElse(DEFAULT_MAX_LENGTH);

    log.info(
        "Preferred term max length resolved to {} for refsets {} on branch {}",
        resolvedMaxLength,
        preferredRefsets,
        defaultBranch);
  }

  @Override
  public boolean isValid(NewConceptDetails details, ConstraintValidatorContext context) {
    if (details == null || details.getPreferredTerm() == null) return true;

    String pt = details.getPreferredTerm();
    if (pt.length() <= resolvedMaxLength) return true;

    context.disableDefaultConstraintViolation();
    context
        .buildConstraintViolationWithTemplate(
            "preferredTerm: Preferred term exceeds maximum length of "
                + resolvedMaxLength
                + " characters. Current length: "
                + pt.length())
        .addConstraintViolation();
    log.warn("Preferred term length {} exceeds maximum {}", pt.length(), resolvedMaxLength);
    return false;
  }
}
