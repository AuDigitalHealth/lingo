package com.csiro.snomio.service;

import static com.csiro.snomio.util.AmtConstants.HAS_OTHER_IDENTIFYING_INFORMATION;
import static com.csiro.snomio.util.SnomedConstants.DEFINED;
import static com.csiro.snomio.util.SnomedConstants.PRIMITIVE;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormReferenceSetMemberViewComponent;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.product.NewConceptDetails;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.util.EclBuilder;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Log
public class NodeGeneratorService {
  SnowstormClient snowstormClient;

  @Autowired
  public NodeGeneratorService(SnowstormClient snowstormClient) {
    this.snowstormClient = snowstormClient;
  }

  public Node generateNode(
      String branch,
      AtomicCache atomicCache,
      Set<SnowstormRelationship> relationships,
      Set<String> refsets,
      String label,
      Set<SnowstormReferenceSetMemberViewComponent> referenceSetMembers,
      String semanticTag,
      List<String> selectedConceptIdentifiers) {

    boolean selectedConcept = false; // indicates if a selected concept has been detected
    Node node = new Node();
    node.setLabel(label);

    // if the relationships are empty or a relationship to a new concept (-ve id)
    // then don't bother looking
    if (!relationships.isEmpty()
        && relationships.stream()
            .noneMatch(r -> !r.getConcrete() && Long.parseLong(r.getDestinationId()) < 0)) {
      String ecl = EclBuilder.build(relationships, refsets);
      Collection<SnowstormConceptMini> matchingConcepts =
          snowstormClient.getConceptsFromEcl(branch, ecl, 10);

      matchingConcepts = filterByOii(branch, relationships, matchingConcepts);

      if (matchingConcepts.isEmpty()) {
        log.warning("No concept found for " + label + " ECL " + ecl);
      } else if (matchingConcepts.size() == 1
          && matchingConcepts.iterator().next().getDefinitionStatus().equals("FULLY_DEFINED")) {
        node.setConcept(matchingConcepts.iterator().next());
        atomicCache.addFsn(node.getConceptId(), node.getFullySpecifiedName());
      } else {
        node.setConceptOptions(matchingConcepts);
        Set<SnowstormConceptMini> selectedConcepts =
            matchingConcepts.stream()
                .filter(c -> selectedConceptIdentifiers.contains(c.getConceptId()))
                .collect(Collectors.toSet());

        if (!selectedConcepts.isEmpty()) {
          if (selectedConcepts.size() > 1) {
            throw new SingleConceptExpectedProblem(
                selectedConcepts,
                " Multiple matches for selected concept identifiers "
                    + String.join(", ", selectedConceptIdentifiers));
          }
          node.setConcept(selectedConcepts.iterator().next());
          selectedConcept = true;
        }
      }
    }

    // if there is no single matching concept found, or the user has selected a single concept
    // provide the modelling for a new concept so they can select a new concept as an option.
    if (node.getConcept() == null || selectedConcept) {
      node.setLabel(label);
      NewConceptDetails newConceptDetails = new NewConceptDetails(atomicCache.getNextId());
      SnowstormAxiom axiom = new SnowstormAxiom();
      axiom.active(true);
      axiom.setDefinitionStatus(
          node.getConceptOptions().isEmpty() ? DEFINED.getValue() : PRIMITIVE.getValue());
      axiom.setRelationships(relationships);
      newConceptDetails.setSemanticTag(semanticTag);
      newConceptDetails.getAxioms().add(axiom);
      newConceptDetails.setReferenceSetMembers(referenceSetMembers);
      node.setNewConceptDetails(newConceptDetails);
    }

    return node;
  }

  /**
   * Post filters a set of concept to remove those that don't match the OII required by the set of
   * candidate relationships - this is because Snowstorm does not support String type concrete
   * domains in ECL so this is a work around.
   *
   * @param branch branch to check the concepts against
   * @param relationships original candidate relationships to check the concepts against
   * @param matchingConcepts matching concepts to filter that matched the ECL
   * @return filtered down set of matching concepts removing any concepts that don't match the OII
   */
  private Collection<SnowstormConceptMini> filterByOii(
      String branch,
      Set<SnowstormRelationship> relationships,
      Collection<SnowstormConceptMini> matchingConcepts) {
    if (relationships.stream()
        .anyMatch(r -> r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue()))) {
      List<String> oii =
          relationships.stream()
              .filter(r -> r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue()))
              .map(r -> r.getConcreteValue().getValue())
              .toList();

      List<String> idsWithMatchingOii =
          matchingConcepts.stream()
              .map(
                  c ->
                      snowstormClient.getRelationships(branch, c.getConceptId()).block().getItems())
              .flatMap(Collection::stream)
              .filter(
                  r ->
                      r.getTypeId().equals(HAS_OTHER_IDENTIFYING_INFORMATION.getValue())
                          && oii.contains(r.getConcreteValue().getValue()))
              .map(SnowstormRelationship::getSourceId)
              .toList();

      matchingConcepts =
          matchingConcepts.stream()
              .filter(c -> idsWithMatchingOii.contains(c.getConceptId()))
              .toList();
    }
    return matchingConcepts;
  }
}
