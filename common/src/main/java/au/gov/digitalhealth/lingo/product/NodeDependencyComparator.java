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
package au.gov.digitalhealth.lingo.product;

import java.util.Comparator;
import java.util.Objects;
import java.util.Set;
import org.jgrapht.alg.TransitiveClosure;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;

public class NodeDependencyComparator implements Comparator<Node> {

  final DirectedAcyclicGraph<String, DefaultEdge> closure;

  NodeDependencyComparator(Set<Node> nodeSet) {
    closure = new DirectedAcyclicGraph<>(DefaultEdge.class);
    nodeSet.forEach(n -> closure.addVertex(n.getConceptId()));
    nodeSet.stream()
        .filter(Node::isNewConcept)
        .forEach(
            n ->
                n.getNewConceptDetails().getAxioms().stream()
                    .flatMap(axoim -> axoim.getRelationships().stream())
                    .filter(
                        r ->
                            r.getConcrete() != null
                                && !r.getConcrete()
                                && Long.parseLong(Objects.requireNonNull(r.getDestinationId())) < 0)
                    .forEach(r -> closure.addEdge(n.getConceptId(), r.getDestinationId())));

    TransitiveClosure.INSTANCE.closeDirectedAcyclicGraph(closure);
  }

  @Override
  public int compare(Node o1, Node o2) {
    /*
     Ordering is based on the number of dependencies, then if one is a dependency of the other,
     then by concept ID.
    */
    if (closure.incomingEdgesOf(o1.getConceptId()).size()
        != closure.incomingEdgesOf(o2.getConceptId()).size()) {
      return Integer.compare(
          closure.incomingEdgesOf(o2.getConceptId()).size(),
          closure.incomingEdgesOf(o1.getConceptId()).size());
    } else if (closure.containsEdge(o1.getConceptId(), o2.getConceptId())) {
      return 1;
    } else if (closure.containsEdge(o2.getConceptId(), o1.getConceptId())) {
      return -1;
    } else {
      return o2.getConceptId().compareTo(o1.getConceptId());
    }
  }
}
