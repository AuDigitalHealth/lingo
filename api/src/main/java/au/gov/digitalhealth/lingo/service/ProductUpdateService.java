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
package au.gov.digitalhealth.lingo.service;

import static au.gov.digitalhealth.lingo.util.ExternalIdentifierUtils.getExternalIdentifiersFromRefsetMembers;
import static au.gov.digitalhealth.lingo.util.SemanticTagUtil.extractSemanticTag;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.*;

import au.csiro.snowstorm_client.model.*;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductExternalIdentifierUpdateRequest;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import jakarta.validation.Valid;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Log
@Service
public class ProductUpdateService {

  SnowstormClient snowstormClient;

  TicketServiceImpl ticketService;
  FieldBindingConfiguration fieldBindingConfiguration;
  Models models;

  public ProductUpdateService(
      SnowstormClient snowstormClient,
      TicketServiceImpl ticketService,
      FieldBindingConfiguration fieldBindingConfiguration,
      Models models) {
    this.snowstormClient = snowstormClient;

    this.ticketService = ticketService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.models = models;
  }

  public SnowstormConceptMini updateProductDescriptions(
      String branch,
      String productId,
      @Valid ProductDescriptionUpdateRequest productDescriptionUpdateRequest) {

    // Retrieve and update concepts
    List<SnowstormConcept> existingConcepts = fetchBrowserConcepts(branch, Set.of(productId));
    SnowstormConceptView conceptsNeedUpdate =
        prepareConceptUpdate(existingConcepts.get(0), productDescriptionUpdateRequest, branch);

    if (conceptsNeedUpdate != null) {
      try {
        SnowstormConceptView updatedConcept =
            snowstormClient.updateConcept(
                branch, conceptsNeedUpdate.getConceptId(), conceptsNeedUpdate, false);
        return SnowstormDtoUtil.toSnowstormConceptMini(updatedConcept);
      } catch (WebClientResponseException ex) {

        String errorBody = ex.getResponseBodyAsString();

        throw new ProductAtomicDataValidationProblem(String.format("%s", errorBody));
      }
    }
    return SnowstormDtoUtil.toSnowstormConceptMini(existingConcepts.get(0));
  }

  private SnowstormConceptView prepareConceptUpdate(
      SnowstormConcept existingConcept,
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      String branch) {
    if (productDescriptionUpdateRequest == null) return null;

    boolean areDescriptionsModified =
        productDescriptionUpdateRequest.areDescriptionsModified(existingConcept.getDescriptions());

    if (!areDescriptionsModified) {
      throw new ProductAtomicDataValidationProblem("No descriptions modified");
    }
    SnowstormConceptView conceptNeedToUpdate =
        SnowstormDtoUtil.toSnowstormConceptView(existingConcept);

    String fsn =
        SnowstormDtoUtil.getFsnFromDescriptions(productDescriptionUpdateRequest.getDescriptions())
            .getTerm();
    String existingFsn =
        Objects.requireNonNull(
                existingConcept.getFsn(),
                "Concept " + existingConcept.getConceptId() + " has no FSN")
            .getTerm();
    if (fsn != null && existingFsn != null && !existingFsn.equals(fsn.trim())) {
      String newFsn = fsn.trim();

      String semanticTag = extractSemanticTag(existingFsn);
      if (semanticTag != null && !newFsn.endsWith(semanticTag)) {
        throw new ProductAtomicDataValidationProblem(
            String.format(
                "The required semantic tag \"%s\" is missing from the FSN \"%s\".",
                semanticTag, newFsn));
      }
      snowstormClient.checkForDuplicateFsn(newFsn, branch);
    }

    // if snowstorm does not recieve the retired descriptions... it is going to delete them
    Set<SnowstormDescription> retiredDescriptions =
        conceptNeedToUpdate.getDescriptions().stream()
            .filter(desc -> Boolean.FALSE.equals(desc.getActive()))
            .collect(Collectors.toSet());

    productDescriptionUpdateRequest.getDescriptions().addAll(retiredDescriptions);
    conceptNeedToUpdate.setDescriptions(productDescriptionUpdateRequest.getDescriptions());

    return conceptNeedToUpdate;
  }

  public List<SnowstormConcept> fetchBrowserConcepts(String branch, Set<String> conceptIds) {
    return snowstormClient
        .getBrowserConcepts(branch, conceptIds)
        .collect(Collectors.toList())
        .block();
  }

  public Set<ExternalIdentifier> updateProductExternalIdentifiers(
      String branch,
      String productId,
      @Valid ProductExternalIdentifierUpdateRequest productExternalIdentifierUpdateRequest)
      throws InterruptedException {
    Set<ExternalIdentifier> externalIdentifiers =
        productExternalIdentifierUpdateRequest.getExternalIdentifiers();

    // Prepare collections for changes
    Set<SnowstormReferenceSetMember> idsToBeRemoved = new HashSet<>();
    Set<SnowstormReferenceSetMemberViewComponent> idsToBeAdded = new HashSet<>();

    Set<MappingRefset> mappingRefsets = models.getModelConfiguration(branch).getMappings();

    // Fetch existing ARTG reference set members
    List<SnowstormReferenceSetMember> existingMembers =
        snowstormClient.getMappingRefsetMembers(branch, Set.of(productId), mappingRefsets);

    if (existingMembers == null || existingMembers.isEmpty()) {
      // Add all externalIdentifiers as new members if no existing members
      externalIdentifiers.forEach(
          identifier ->
              idsToBeAdded.add(
                  createSnowstormReferenceSetMemberViewComponent(
                      identifier, productId, mappingRefsets)));
    } else {
      // Process external identifiers
      processExternalIdentifiers(
          existingMembers,
          externalIdentifiers,
          productId,
          idsToBeAdded,
          idsToBeRemoved,
          mappingRefsets);
    }

    // Apply changes

    if (!idsToBeAdded.isEmpty()) {
      snowstormClient.createRefsetMembers(branch, List.copyOf(idsToBeAdded));
    }

    // Remove outdated ARTG members
    if (!idsToBeRemoved.isEmpty()) {
      snowstormClient.removeRefsetMembers(branch, idsToBeRemoved);
    }

    return externalIdentifiers;
  }

  private void processExternalIdentifiers(
      List<SnowstormReferenceSetMember> existingMembers,
      Set<ExternalIdentifier> externalIdentifiers,
      String productId,
      Set<SnowstormReferenceSetMemberViewComponent> idsToBeAdded,
      Set<SnowstormReferenceSetMember> idsToBeRemoved,
      Set<MappingRefset> mappingRefsets) {

    Map<ExternalIdentifier, SnowstormReferenceSetMember> existingIdentifiersMap = new HashMap<>();
    existingMembers.forEach(
        member ->
            existingIdentifiersMap.put(
                getExternalIdentifiersFromRefsetMembers(Set.of(member), productId, mappingRefsets)
                    .iterator()
                    .next(),
                member));

    // Identify ARTG to be added
    externalIdentifiers.stream()
        .filter(identifier -> !existingIdentifiersMap.containsKey(identifier))
        .forEach(
            identifier ->
                idsToBeAdded.add(
                    createSnowstormReferenceSetMemberViewComponent(
                        identifier, productId, mappingRefsets)));

    // Identify ARTG to be removed
    existingIdentifiersMap.entrySet().stream()
        .filter(entry -> !externalIdentifiers.contains(entry.getKey()))
        .forEach(entry -> idsToBeRemoved.add(entry.getValue()));
  }
}
