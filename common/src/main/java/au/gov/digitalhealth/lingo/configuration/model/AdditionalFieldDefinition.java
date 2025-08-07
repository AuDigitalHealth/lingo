package au.gov.digitalhealth.lingo.configuration.model;

import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class AdditionalFieldDefinition {
  @NotBlank String title;

  /** The data type of the property. */
  @NotNull private NonDefiningPropertyDataType dataType;

  /**
   * Optional validation regex for the value of the property value to be applied beyond simple
   * datatype validation.
   */
  private String valueRegexValidation;

  /**
   * Optional error message to be returned if the value does not match the valueRegexValidation. If
   * not specified, a default message will be used.
   */
  private String valueValidationErrorMessage;

  /** ECL binding for concept values. Only valid if datatype = CONCEPT */
  private String eclBinding;

  /** CodeSystem URI for the value */
  private String codeSystem;

  /**
   * Provies a list of allowed values for the property, if blank the user is not restricted to a set
   * of values. These values must match the data type of the property and the valueRegexValidation
   * if specified.
   */
  private List<String> allowedValues = new ArrayList<>();
}
