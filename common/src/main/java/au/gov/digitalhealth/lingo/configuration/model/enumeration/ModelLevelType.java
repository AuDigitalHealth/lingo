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
package au.gov.digitalhealth.lingo.configuration.model.enumeration;

public enum ModelLevelType {
  MEDININCAL_PRODUCT,
  MEDICINAL_PRODUCT_ONLY,
  MEDICINAL_PRODUCT_PRECISELY,
  MEDICINAL_PRODUCT_FORM,
  MEDICINAL_PRODUCT_ONLY_FORM,
  PRODUCT_NAME,
  REAL_MEDICINAL_PRODUCT,
  CLINICAL_DRUG,
  REAL_CLINICAL_DRUG,
  PACKAGED_CLINICAL_DRUG,
  REAL_PACKAGED_CLINICAL_DRUG,
  REAL_CONTAINERIZED_PACKAGED_CLINICAL_DRUG
}
