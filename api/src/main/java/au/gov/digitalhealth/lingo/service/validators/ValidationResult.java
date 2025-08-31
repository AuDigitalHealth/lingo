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
package au.gov.digitalhealth.lingo.service.validators;

import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class ValidationResult {
  List<ValidationProblem> problems = new ArrayList<>();
  List<ValidationProblem> warnings = new ArrayList<>();

  public void addProblem(String message) {
    problems.add(new ValidationProblem(message));
  }

  public void addWarning(String message) {
    warnings.add(new ValidationProblem(message));
  }

  public boolean isValid() {
    return problems.isEmpty();
  }

  public void throwIfInvalid() {
    if (!isValid()) {
      StringBuilder messageBuilder =
          new StringBuilder("Validation failed with the following problems:");
      for (ValidationProblem problem : problems) {
        messageBuilder.append("\n- ").append(problem.getMessage());
      }
      if (!warnings.isEmpty()) {
        messageBuilder.append("\nWarnings were:");
        for (ValidationProblem problem : warnings) {
          messageBuilder.append("\n- ").append(problem.getMessage());
        }
      }
      throw new ProductAtomicDataValidationProblem(messageBuilder.toString());
    }
  }

  @Data
  @AllArgsConstructor
  public static class ValidationProblem {
    private String message;
  }
}
