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

import java.io.Serializable;
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
public class SearchCondition implements Serializable {
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
