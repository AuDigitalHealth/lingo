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
package au.gov.digitalhealth.tickets.helper;

public class SearchConditionUtils {

  public static final String NOT_EQUALS = "!=";

  public static final String EQUAL_TO = "=";
  public static final String GREATER_THAN = ">=";
  public static final String LESS_THAN = "<=";

  /**
   * Operations that ask whether a field holds a value at all, rather than comparing it to one. They
   * carry no value of their own, so callers must check for them before parsing one.
   */
  public static final String IS_NULL = "isNull";

  public static final String IS_NOT_NULL = "isNotNull";

  public static boolean isBlankOperation(String operation) {
    return IS_NULL.equals(operation) || IS_NOT_NULL.equals(operation);
  }

  private SearchConditionUtils() {}
}
