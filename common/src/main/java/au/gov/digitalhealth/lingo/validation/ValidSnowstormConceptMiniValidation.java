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

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.util.PartionIdentifier;
import au.gov.digitalhealth.lingo.util.SnomedIdentifierUtil;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.ArrayList;
import java.util.List;

public class ValidSnowstormConceptMiniValidation
    implements ConstraintValidator<ValidSnowstormConceptMini, SnowstormConceptMini> {

  private boolean allowNull;
  private boolean requirePt;
  private boolean requireFsn;

  @Override
  public void initialize(ValidSnowstormConceptMini annotation) {
    this.allowNull = annotation.allowNull();
    this.requirePt = annotation.requirePreferredTerm();
    this.requireFsn = annotation.requireFullySpecifiedName();
  }

  @Override
  public boolean isValid(SnowstormConceptMini value, ConstraintValidatorContext context) {
    if (value == null) {
      if (allowNull) {
        return true; // no violation
      }
      // custom violation for null
      context.disableDefaultConstraintViolation();
      context
          .buildConstraintViolationWithTemplate("concept must not be null")
          .addConstraintViolation();
      return false;
    }

    List<Violation> errors = new ArrayList<>();

    String id = value.getConceptId();
    if (id == null || id.isBlank()) {
      errors.add(new Violation("conceptId is missing", "conceptId"));
    } else if (!SnomedIdentifierUtil.isValid(id, PartionIdentifier.CONCEPT)) {
      errors.add(new Violation("conceptId must be a valid concept id, got: " + id, "conceptId"));
    }

    if (requirePt) {
      var pt = value.getPt();
      if (pt == null || pt.getTerm() == null || pt.getTerm().isBlank()) {
        errors.add(new Violation("preferred term (pt.term) is missing", "pt.term"));
      }
    }

    if (requireFsn) {
      var fsn = value.getFsn();
      if (fsn == null || fsn.getTerm() == null || fsn.getTerm().isBlank()) {
        errors.add(new Violation("fully specified name (fsn.term) is missing", "fsn.term"));
      }
    }

    if (value.getDefinitionStatus() == null) {
      errors.add(new Violation("definition status is missing", "definitionStatus"));
    }

    if (errors.isEmpty()) return true;

    context.disableDefaultConstraintViolation();
    for (Violation v : errors) {
      ConstraintValidatorContext.ConstraintViolationBuilder builder =
          context.buildConstraintViolationWithTemplate(v.message);
      if (v.path != null && !v.path.isBlank()) {
        String[] nodes = v.path.split("\\.");
        ConstraintValidatorContext.ConstraintViolationBuilder.NodeBuilderCustomizableContext
            nodeCtx = builder.addPropertyNode(nodes[0]);
        for (int i = 1; i < nodes.length; i++) {
          nodeCtx = nodeCtx.addPropertyNode(nodes[i]);
        }
        nodeCtx.addConstraintViolation();
      } else {
        builder.addConstraintViolation();
      }
    }
    return false;
  }

  /**
   * @param path e.g. "conceptId" or "pt.term"
   */
  record Violation(String message, String path) {}
}
