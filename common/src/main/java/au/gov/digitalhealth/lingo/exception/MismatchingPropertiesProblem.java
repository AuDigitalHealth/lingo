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

import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import jakarta.validation.Valid;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;

public class MismatchingPropertiesProblem extends LingoProblem {

  public MismatchingPropertiesProblem(Map<String, Set<Node>> mismatchedNodes) {
    super(
        "mismatching-properties",
        "Mismatching properties",
        HttpStatus.BAD_REQUEST,
        buildDetails(mismatchedNodes));
  }

  private static String buildDetails(Map<String, Set<Node>> mismatchedNodes) {
    StringBuilder sb = new StringBuilder();

    mismatchedNodes.forEach(
        (conceptId, nodes) -> {
          Node firstNode = nodes.iterator().next();
          String name = firstNode.getPreferredTerm();

          Set<String> missingProperties = new HashSet<>();

          Set<String> allSchemes =
              nodes.stream()
                  .flatMap(n -> n.getNonDefiningProperties().stream())
                  .map(p -> p.getIdentifierScheme())
                  .collect(Collectors.toSet());

          Map<String, Set<NonDefiningBase>> knownValues = new HashMap<>();
          for (String scheme : allSchemes) {
            for (Node n : nodes) {
              if (n.getNonDefiningProperties().stream()
                  .noneMatch(p -> p.getIdentifierScheme().equals(scheme))) {
                missingProperties.add(scheme);
              } else {
                final Set<@Valid NonDefiningBase> propertiesForTheScheme =
                    n.getNonDefiningProperties().stream()
                        .filter(p -> p.getIdentifierScheme().equals(scheme))
                        .collect(Collectors.toSet());
                if (knownValues.containsKey(scheme)) {
                  final Set<NonDefiningBase> knownValuesForScheme = knownValues.get(scheme);
                  if (!knownValuesForScheme.equals(propertiesForTheScheme)) {
                    knownValuesForScheme.addAll(propertiesForTheScheme);
                  }
                } else {
                  knownValues.put(scheme, new HashSet<>(propertiesForTheScheme));
                }
              }
            }
          }

          if (!missingProperties.isEmpty()) {
            sb.append(
                String.format(
                    "Missing properties for %s (%s): %s\n",
                    conceptId, name, String.join(", ", missingProperties)));
            sb.append("\n");
          }

          if (knownValues.values().stream().anyMatch(l -> l.size() > 1)) {
            sb.append(
                String.format(
                    "Mismatching properties for %s (%s): %s\n",
                    conceptId,
                    name,
                    knownValues.values().stream()
                        .filter(l -> l.size() > 1)
                        .flatMap(Collection::stream)
                        .map(NonDefiningBase::toDisplay)
                        .collect(Collectors.joining(", \n"))));
            sb.append("\n");
          }
        });

    return "Cascading properties results in mismatched properties:\n" + sb + "\n";
  }
}
