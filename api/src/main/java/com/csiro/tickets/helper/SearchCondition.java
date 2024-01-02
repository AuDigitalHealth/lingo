package com.csiro.tickets.helper;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchCondition {
  private String key;
  private String operation;
  private String value;
  private List<String> valueIn;
  private String condition;

  public static class SearchConditionBuilder {
    private List<String> valueIn;

    public SearchConditionBuilder valueIn(String value) {
      this.valueIn = parseValuesInBrackets(value);
      return this;
    }

    private List<String> parseValuesInBrackets(String input) {
      // Regular expression to match names inside square brackets
      Pattern pattern = Pattern.compile("\\[([^\\]]*)\\]");
      Matcher matcher = pattern.matcher(input);

      if (matcher.matches()) {
        // Group 1 contains the names
        String namesString = matcher.group(1);

        // Split the names by comma
        String[] nameArray = namesString.split(",");

        // Convert array to a list
        List<String> namesList = new ArrayList<>();
        for (String name : nameArray) {
          namesList.add(name.trim()); // Trim to remove leading/trailing whitespaces
        }

        return namesList;
      } else {
        return null; // Invalid format
      }
    }
  }
}
