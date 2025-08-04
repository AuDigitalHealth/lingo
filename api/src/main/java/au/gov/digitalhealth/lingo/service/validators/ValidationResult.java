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
