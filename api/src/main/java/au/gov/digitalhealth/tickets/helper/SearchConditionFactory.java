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

import java.util.ArrayList;
import java.util.List;

public class SearchConditionFactory {

  private SearchConditionFactory() {}

  public static List<SearchCondition> parseSearchConditions(String searchParam) {
    List<SearchCondition> conditions = new ArrayList<>();

    String[] conditionsArray = searchParam.split("(?=&)|(?<=&)");

    String lastCondition = "&";

    for (String condition : conditionsArray) {
      if (condition.equals("&") || condition.equals(",")) {
        lastCondition = condition;
        continue;
      }
      String[] parts = condition.split("=");

      if (parts.length == 2) {
        String key = parts[0];
        String value = parts[1];
        String operator = lastCondition.equals("&") ? "and" : "or";

        conditions.add(
            SearchCondition.builder()
                .key(key)
                .operation("=")
                .value(value)
                .valueIn(value)
                .condition(operator)
                .build());
      }
    }

    return conditions;
  }
}
