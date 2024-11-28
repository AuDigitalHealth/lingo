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

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SemanticTagUtil {
  public static String extractSemanticTag(String input) {
    // Regular expression to match substrings in the format "(xyz)"
    Pattern pattern = Pattern.compile("\\(.*?\\)");
    Matcher matcher = pattern.matcher(input);

    String lastMatch = null;

    // Iterate through all matches and store the last one
    while (matcher.find()) {
      lastMatch = matcher.group();
    }

    return lastMatch;
  }
}
