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

import au.csiro.snowstorm_client.model.SnowstormDescription;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Objects;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ValidProductDescriptionPreferredTermLengthValidator
    implements ConstraintValidator<
        ValidProductDescriptionPreferredTermLength, ProductDescriptionUpdateRequest> {

  private static final Logger log =
      LoggerFactory.getLogger(ValidProductDescriptionPreferredTermLengthValidator.class);

  @Value("${ihtsdo.ap.defaultBranch}")
  private String defaultBranch;

  @Autowired private Models models;

  @Autowired private ValidPreferredTermLengthValidator preferredTermLengthValidator;

  @Override
  public boolean isValid(
      ProductDescriptionUpdateRequest request, ConstraintValidatorContext context) {
    if (request == null || request.getDescriptions() == null) return true;

    int maxLength = preferredTermLengthValidator.getResolvedMaxLength();
    Set<String> preferredRefsets =
        models.getModelConfiguration(defaultBranch.replace("/", "|")).getPreferredLanguageRefsets();

    for (SnowstormDescription desc : request.getDescriptions()) {
      if (!Boolean.TRUE.equals(desc.getActive())) continue;
      if (!isPreferredTerm(desc, preferredRefsets)) continue;

      String term = desc.getTerm();
      if (term != null && term.length() > maxLength) {
        context.disableDefaultConstraintViolation();
        context
            .buildConstraintViolationWithTemplate(
                "preferredTerm: Preferred term exceeds maximum length of "
                    + maxLength
                    + " characters. Current length: "
                    + term.length())
            .addConstraintViolation();
        log.warn("Preferred term length {} exceeds maximum {}", term.length(), maxLength);
        return false;
      }
    }
    return true;
  }

  private boolean isPreferredTerm(SnowstormDescription desc, Set<String> preferredRefsets) {
    if (!Objects.equals(desc.getType(), "SYNONYM")) return false;
    if (desc.getAcceptabilityMap() == null) return false;
    return preferredRefsets.stream()
        .anyMatch(refset -> "PREFERRED".equals(desc.getAcceptabilityMap().get(refset)));
  }
}
