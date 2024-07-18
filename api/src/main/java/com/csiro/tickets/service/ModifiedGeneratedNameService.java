package com.csiro.tickets.service;

import com.csiro.snomio.product.NameGeneratorSpec;
import com.csiro.snomio.product.NewConceptDetails;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.service.AtomicCache;
import com.csiro.snomio.service.NameGenerationService;
import com.csiro.snomio.util.AmtConstants;
import com.csiro.snomio.util.SnomedConstants;
import com.csiro.tickets.models.ModifiedGeneratedName;
import com.csiro.tickets.repository.ModifiedGeneratedNameRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.apache.commons.collections4.BidiMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ModifiedGeneratedNameService {

  NameGenerationService nameGenerationService;

  ModifiedGeneratedNameRepository modifiedGeneratedNameRepository;

  @Autowired
  public ModifiedGeneratedNameService(
      NameGenerationService nameGenerationService,
      ModifiedGeneratedNameRepository modifiedGeneratedNameRepository) {
    this.nameGenerationService = nameGenerationService;
    this.modifiedGeneratedNameRepository = modifiedGeneratedNameRepository;
  }

  public void createAndSaveModifiedGeneratedNames(
      Map<String, String> idFsnMap,
      ProductSummary productSummaryClone,
      String branch,
      BidiMap<String, String> idMap) {

    List<ModifiedGeneratedName> modifiedGeneratedNames =
        productSummaryClone.getNodes().stream()
            .filter(Node::isNewConcept)
            .flatMap(
                node -> {
                  NewConceptDetails newConceptDetails = node.getNewConceptDetails();

                  if (newConceptDetails.isFsnOrPtModified()) {
                    Optional<NameGeneratorSpec> nameGeneratorSpec =
                        nameGenerationService.generateNameGeneratorSpec(
                            new AtomicCache(
                                idFsnMap, AmtConstants.values(), SnomedConstants.values()),
                            newConceptDetails.getSemanticTag(),
                            node);
                    if (nameGeneratorSpec.isEmpty()) return Stream.empty();
                    ModifiedGeneratedName.ModifiedGeneratedNameBuilder mgnb =
                        ModifiedGeneratedName.builder()
                            .taskId(branch)
                            .generatedFullySpecifiedName(
                                newConceptDetails.getGeneratedFullySpecifiedName())
                            .modifiedFullySpecifiedName(newConceptDetails.getFullySpecifiedName())
                            .generatedPreferredTerm(newConceptDetails.getGeneratedPreferredTerm())
                            .modifiedPreferredTerm(newConceptDetails.getPreferredTerm())
                            .nameGeneratorSpec(nameGeneratorSpec.get())
                            .identifier(idMap.get(newConceptDetails.getConceptId().toString()));
                    return Stream.of(mgnb.build());
                  }
                  return Stream.empty();
                })
            .toList();

    if (!modifiedGeneratedNames.isEmpty()) {
      modifiedGeneratedNameRepository.saveAll(modifiedGeneratedNames);
    }
  }
}
