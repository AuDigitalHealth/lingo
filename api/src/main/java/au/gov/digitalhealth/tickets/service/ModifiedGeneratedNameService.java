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
package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.product.NameGeneratorSpec;
import au.gov.digitalhealth.lingo.product.NewConceptDetails;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.service.AtomicCache;
import au.gov.digitalhealth.lingo.service.NameGenerationService;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.tickets.models.ModifiedGeneratedName;
import au.gov.digitalhealth.tickets.repository.ModifiedGeneratedNameRepository;
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

  Models models;

  @Autowired
  public ModifiedGeneratedNameService(
      NameGenerationService nameGenerationService,
      ModifiedGeneratedNameRepository modifiedGeneratedNameRepository,
      Models models) {
    this.nameGenerationService = nameGenerationService;
    this.modifiedGeneratedNameRepository = modifiedGeneratedNameRepository;
    this.models = models;
  }

  public void createAndSaveModifiedGeneratedNames(
      Map<String, String> idFsnMap,
      ProductSummary productSummaryClone,
      String branch,
      BidiMap<String, String> idMap) {

    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);

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
                            node,
                            modelConfiguration.getModuleId());
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
