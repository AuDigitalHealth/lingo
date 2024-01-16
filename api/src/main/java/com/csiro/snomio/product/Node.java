package com.csiro.snomio.product;

import static com.csiro.snomio.util.SnomedConstants.DEFINED;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import com.csiro.snomio.exception.CoreferentNodesProblem;
import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.validation.OnlyOnePopulated;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Comparator;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.java.Log;
import org.jgrapht.alg.TransitiveClosure;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;

/**
 * A node in a {@link ProductSummary} which represents a concept with a particular label indicating
 * the type of the node in the context of the product. This DTO can also represent a new concept
 * that has not yet been created in Snowstorm.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Log
@OnlyOnePopulated(
    fields = {"concept", "newConceptDetails"},
    message = "Node must represent a concept or a new concept, not both")
public class Node {
  /**
   * Existing concept in the terminology for this node. Either this element or newConceptDetails is
   * populated, not both.
   */
  SnowstormConceptMini concept;

  /** Label for this node indicating its place in the model. */
  @NotNull @NotEmpty String label;

  /**
   * Details of a new concept that has not yet been created in the terminology. Either this element
   * or concept is populated, not both.
   */
  @Valid NewConceptDetails newConceptDetails;

  public Node(SnowstormConceptMini concept, String label) {
    this.concept = concept;
    this.label = label;
  }

  public static Comparator<@Valid Node> getNodeComparator(Set<Node> nodeSet) {
    return new NodeDependencyComparator(nodeSet);
  }

  /**
   * Returns the concept ID of the concept represented by this node. If the node represents an
   * existing concept that ID will be returned, otherwise if it represents a new concept the
   * temporary concept ID will be returned. Either way this will be the ID used in the edges of the
   * product model.
   */
  @JsonProperty(value = "conceptId", access = JsonProperty.Access.READ_ONLY)
  public String getConceptId() {
    if (concept != null) {
      return concept.getConceptId();
    }
    if (newConceptDetails.getSpecifiedConceptId() != null
        && !newConceptDetails
            .getSpecifiedConceptId()
            .equalsIgnoreCase(newConceptDetails.getConceptId().toString())) {
      return newConceptDetails.getSpecifiedConceptId();
    } else {
      return newConceptDetails.getConceptId().toString();
    }
  }

  /** Returns the concept represented by this node as ID and FSN, usually for logging. */
  @JsonProperty(value = "idAndFsnTerm", access = JsonProperty.Access.READ_ONLY)
  public String getIdAndFsnTerm() {
    if (concept != null) {
      return concept.getIdAndFsnTerm();
    }
    return getConceptId() + "| " + newConceptDetails.getFullySpecifiedName() + "|";
  }

  @JsonProperty(value = "preferredTerm", access = JsonProperty.Access.READ_ONLY)
  public String getPreferredTerm() {
    if (isNewConcept()) {
      return newConceptDetails.getPreferredTerm();
    }
    return Objects.requireNonNull(concept.getPt()).getTerm();
  }

  @JsonProperty(value = "fullySpecifiedName", access = JsonProperty.Access.READ_ONLY)
  public String getFullySpecifiedName() {
    if (isNewConcept()) {
      return newConceptDetails.getFullySpecifiedName();
    }
    return Objects.requireNonNull(concept.getFsn()).getTerm();
  }

  /**
   * Returns true if this node represents a new concept, or false if it represents an existing
   * concept.
   */
  @JsonProperty(value = "newConcept", access = JsonProperty.Access.READ_ONLY)
  public boolean isNewConcept() {
    return newConceptDetails != null;
  }

  public SnowstormConceptMini toConceptMini() {
    if (concept != null) {
      return getConcept();
    } else if (newConceptDetails != null) {
      SnowstormConceptMini cm = new SnowstormConceptMini();
      return cm.conceptId(newConceptDetails.getConceptId().toString())
          .fsn(
              new SnowstormTermLangPojo()
                  .lang("en")
                  .term(newConceptDetails.getFullySpecifiedName()))
          .pt(new SnowstormTermLangPojo().lang("en").term(newConceptDetails.getPreferredTerm()))
          .idAndFsnTerm(getIdAndFsnTerm())
          .definitionStatus(
              newConceptDetails.getAxioms().stream()
                      .anyMatch(a -> Objects.equals(a.getDefinitionStatus(), DEFINED.getValue()))
                  ? DEFINED.getValue()
                  : PRIMITIVE.getValue())
          .moduleId(AmtConstants.SCT_AU_MODULE.getValue());
    } else {
      throw new IllegalStateException("Node must represent a concept or a new concept, not both");
    }
  }

  static class NodeDependencyComparator implements Comparator<Node> {
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
                      .filter(r -> !r.getConcrete() && Long.parseLong(r.getDestinationId()) < 0)
                      .forEach(r -> closure.addEdge(n.getConceptId(), r.getDestinationId())));

      TransitiveClosure.INSTANCE.closeDirectedAcyclicGraph(closure);
    }

    @Override
    public int compare(Node o1, Node o2) {
      if (closure.containsEdge(o1.getConceptId(), o2.getConceptId())
          && closure.containsEdge(o2.getConceptId(), o1.getConceptId())) {
        throw new CoreferentNodesProblem(o1, o2);
      }

      String o1Roots = this.getRoots(o1);
      String o2Roots = this.getRoots(o2);

      // if they are in the same tree, sort them in dependency order
      if (closure.containsEdge(o1.getConceptId(), o2.getConceptId())) {
        return 1;
      } else if (closure.containsEdge(o2.getConceptId(), o1.getConceptId())) {
        return -1;
      }

      // if they are from different trees, arbitrarily sort them so the trees are lumped together
      return o1Roots.compareTo(o2Roots);
    }

    private String getRoots(Node node) {
      String roots =
          closure.getDescendants(node.getConceptId()).stream()
              .filter(n -> closure.getDescendants(n).isEmpty())
              .sorted()
              .collect(Collectors.joining());
      if (roots.isEmpty()) {
        roots = node.getConceptId();
      }

      return roots;
    }
  }
}
