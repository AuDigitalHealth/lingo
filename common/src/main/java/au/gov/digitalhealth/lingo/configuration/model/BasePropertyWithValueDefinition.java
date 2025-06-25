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
package au.gov.digitalhealth.lingo.configuration.model;

import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.validation.OnlyOnePopulated;
import au.gov.digitalhealth.lingo.validation.ValidAllowedValues;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@ValidAllowedValues
@OnlyOnePopulated(
    fields = {"eclBinding", "valueSetReference"},
    message = "Only eclBinding or valueSetReference can be populated, not both")
public abstract class BasePropertyWithValueDefinition extends BasePropertyDefinition {

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

  /** External reference to a value set. */
  private String valueSetReference;

  /** Indicates if the property is mandatory. */
  private boolean isMandatory;

  /** Indicates if the property allows multiple values. */
  private boolean isMultiValued;

  private boolean isShowDefaultOptions;

  /**
   * Provies a list of allowed values for the property, if blank the user is not restricted to a set
   * of values. These values must match the data type of the property and the valueRegexValidation
   * if specified.
   */
  private List<String> allowedValues;

  /** If the property is read only it will not be displayed in the UI for editing. */
  private boolean readOnly;
}
