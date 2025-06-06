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
package au.gov.digitalhealth.lingo.util;

public class CacheConstants {

  public static final String USERS_CACHE = "users";
  public static final String JIRA_USERS_CACHE = "jiraUsers";
  public static final String SNOWSTORM_STATUS_CACHE = "snowstorm-status";
  public static final String AP_STATUS_CACHE = "ap-status";
  public static final String ALL_TASKS_CACHE = "all-tasks";
  public static final String COMPOSITE_UNIT_CACHE = "composite-unit";
  public static final String UNIT_NUMERATOR_DENOMINATOR_CACHE = "unit-numerator-denominator";
  public static final String VALIDATION_EXCLUDED_SUBSTANCES = "validation-excluded-substances";
  public static final String BRAND_SEMANTIC_TAG = "brand-semantic-tag";
  public static final String SNOWSTORM_CONCEPTS_IDS_FROM_ECL = "snowstorm-concepts-ids-from-ecl";
  public static final String SNOWSTORM_CONCEPTS_FROM_ECL = "snowstorm-concepts-from-ecl";
  public static final String SNOWSTORM_CONCEPT = "snowstorm-concept";
  public static final String SNOWSTORM_REFSET_MEMBERS = "snowstorm-refset-members";
  public static final String SNOWSTORM_BROWSER_CONCEPTS = "snowstorm-browser-concepts";
  public static final String SNOWSTORM_RELATIONSHIPS = "snowstorm-relationships";
  public static final String SNOWSTORM_CONCEPTS_BY_TERM = "snowstorm-concepts-by-term";
  public static final String SNOWSTORM_CONCEPTS_BY_IDS = "snowstorm-concepts-by-ids";
  public static final String SNOWSTORM_CONCEPT_IDS_EXIST = "snowstorm-concept-ids-exist";
  public static final String SNOWSTORM_CONCEPTS_FOR_BRANCH = "snowstorm-concepts-for-branch";
  public static final String FHIR_CONCEPTS = "fhir-concepts";

  private CacheConstants() {
    throw new IllegalStateException("Utility class");
  }
}
