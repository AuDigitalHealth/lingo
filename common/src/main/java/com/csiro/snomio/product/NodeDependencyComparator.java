package com.csiro.snomio.product;

import java.util.Comparator;
import java.util.Objects;
import java.util.Set;
import org.jgrapht.alg.TransitiveClosure;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NodeDependencyComparator implements Comparator<Node> {

  private static final Logger log = LoggerFactory.getLogger(NodeDependencyComparator.class);
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
