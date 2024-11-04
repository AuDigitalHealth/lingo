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
package au.gov.digitalhealth.lingo.exception;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import java.util.Collection;
import java.util.stream.Collectors;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class SingleConceptExpectedProblem extends LingoProblem {

  final transient int size;

  public SingleConceptExpectedProblem(
      String branch, String ecl, Collection<SnowstormConceptMini> concepts) {
    super(
        "single-concept-ecl",
        "Single concept expected from ECL",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Expected a single concept ecl '"
            + ecl
            + "' on branch '"
            + branch
            + "' but found "
            + concepts.size());
    this.size = concepts.size();
  }

  public SingleConceptExpectedProblem(String message, int size) {
    super("single-concept", "Single concept expected", HttpStatus.INTERNAL_SERVER_ERROR, message);
    this.size = size;
  }

  public SingleConceptExpectedProblem(Collection<SnowstormConceptMini> concepts, String message) {
    super(
        "single-concept",
        "Single concept expected",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Expected a single concept but found "
            + concepts.stream()
                .map(SnowstormConceptMini::getConceptId)
                .collect(Collectors.joining())
            + " - "
            + message);
    this.size = concepts.size();
  }
}
