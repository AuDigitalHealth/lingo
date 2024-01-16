package com.csiro.tickets.helper;

import java.util.ArrayList;
import java.util.List;

public class SearchConditionFactory {

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
