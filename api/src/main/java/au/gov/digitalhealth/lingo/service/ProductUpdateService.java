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

import static au.gov.digitalhealth.lingo.service.AtomicDataService.MAP_TARGET;
import static au.gov.digitalhealth.lingo.util.SemanticTagUtil.extractSemanticTag;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.*;

import au.csiro.snowstorm_client.model.*;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductExternalIdentifierUpdateRequest;
import au.gov.digitalhealth.lingo.util.SnomedConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import jakarta.validation.Valid;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.stereotype.Service;

@Log
@Service
public class ProductUpdateService {

  SnowstormClient snowstormClient;

  TicketServiceImpl ticketService;
  FieldBindingConfiguration fieldBindingConfiguration;

  public ProductUpdateService(
      SnowstormClient snowstormClient,
      TicketServiceImpl ticketService,
      FieldBindingConfiguration fieldBindingConfiguration) {
    this.snowstormClient = snowstormClient;

    this.ticketService = ticketService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
  }

  public SnowstormConceptMini updateProductDescriptions(
      String branch,
      String productId,
      @Valid ProductDescriptionUpdateRequest productDescriptionUpdateRequest) {

    // Validate ticket existence
    ticketService.findTicket(productDescriptionUpdateRequest.getTicketId());

    // Retrieve and update concepts
    List<SnowstormConcept> existingConcepts = fetchBrowserConcepts(branch, Set.of(productId));
    SnowstormConceptView conceptsNeedUpdate =
        prepareConceptUpdate(existingConcepts.get(0), productDescriptionUpdateRequest, branch);
    if (conceptsNeedUpdate != null) {
      SnowstormConceptView updatedConcept =
          snowstormClient.updateConcept(
              branch, conceptsNeedUpdate.getConceptId(), conceptsNeedUpdate, false);

      return SnowstormDtoUtil.toSnowstormConceptMini(updatedConcept);
    }
    return SnowstormDtoUtil.toSnowstormConceptMini(existingConcepts.get(0));
  }

  private SnowstormConceptView prepareConceptUpdate(
      SnowstormConcept existingConcept,
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      String branch) {
    if (productDescriptionUpdateRequest == null) return null;

    boolean isFsnModified =
        productDescriptionUpdateRequest.isValidFullySpecifiedName()
            && !existingConcept
                .getFsn()
                .getTerm()
                .equals(productDescriptionUpdateRequest.getFullySpecifiedName());
    boolean isPtModified =
        productDescriptionUpdateRequest.isValidPreferredTerm()
            && !existingConcept
                .getPt()
                .getTerm()
                .equals(productDescriptionUpdateRequest.getPreferredTerm());

    if (!isFsnModified && !isPtModified) return null;

    SnowstormConceptView conceptNeedToUpdate =
        SnowstormDtoUtil.toSnowstormConceptView(existingConcept);
    if (isFsnModified) {
      String newFsn = productDescriptionUpdateRequest.getFullySpecifiedName();
      String existingFsn = existingConcept.getFsn().getTerm();
      String semanticTag = extractSemanticTag(existingFsn);
      if (semanticTag != null && !newFsn.endsWith(semanticTag)) {
        throw new ProductAtomicDataValidationProblem(
            String.format(
                "The required semantic tag \"%s\" is missing from the FSN \"%s\".",
                semanticTag, newFsn));
      }

      snowstormClient.checkForDuplicateFsn(newFsn, branch);
      SnowstormDtoUtil.removeDescription(
          conceptNeedToUpdate, existingConcept.getFsn().getTerm(), SnomedConstants.FSN.getValue());
      SnowstormDtoUtil.addDescription(
          conceptNeedToUpdate,
          productDescriptionUpdateRequest.getFullySpecifiedName(),
          SnomedConstants.FSN.getValue());
    }
    if (isPtModified) {
      SnowstormDtoUtil.removeDescription(
          conceptNeedToUpdate,
          existingConcept.getPt().getTerm(),
          SnomedConstants.SYNONYM.getValue());

      SnowstormDtoUtil.addDescription(
          conceptNeedToUpdate,
          productDescriptionUpdateRequest.getPreferredTerm(),
          SnomedConstants.SYNONYM.getValue());
    }
    return conceptNeedToUpdate;
  }

  private List<SnowstormConcept> fetchBrowserConcepts(String branch, Set<String> conceptIds) {
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
    Set<SnowstormReferenceSetMember> artgToBeRemoved = new HashSet<>();
    Set<SnowstormReferenceSetMemberViewComponent> artgToBeAdded = new HashSet<>();

    // Fetch existing ARTG reference set members
    List<SnowstormReferenceSetMember> existingMembers =
        snowstormClient.getArtgMembers(branch, Set.of(productId));

    if (existingMembers == null || existingMembers.isEmpty()) {
      // Add all externalIdentifiers as new members if no existing members
      externalIdentifiers.forEach(
          identifier ->
              artgToBeAdded.add(
                  createSnowstormReferenceSetMemberViewComponent(identifier, productId)));
    } else {
      // Process external identifiers
      processExternalIdentifiers(
          existingMembers, externalIdentifiers, productId, artgToBeAdded, artgToBeRemoved);
    }

    // Apply changes

    if (!artgToBeAdded.isEmpty()) {
      snowstormClient.createRefsetMembers(branch, List.copyOf(artgToBeAdded));
    }

    // Remove outdated ARTG members
    if (!artgToBeRemoved.isEmpty()) {
      Set<String> memberIdsToRemove =
          artgToBeRemoved.stream()
              .map(SnowstormReferenceSetMember::getMemberId)
              .collect(Collectors.toSet());
      snowstormClient.removeRefsetMembers(
          branch, new SnowstormMemberIdsPojoComponent().memberIds(memberIdsToRemove), true);
    }

    return externalIdentifiers;
  }

  private void processExternalIdentifiers(
      List<SnowstormReferenceSetMember> existingMembers,
      Set<ExternalIdentifier> externalIdentifiers,
      String productId,
      Set<SnowstormReferenceSetMemberViewComponent> artgToBeAdded,
      Set<SnowstormReferenceSetMember> artgToBeRemoved) {

    Set<String> existingMapTargets =
        existingMembers.stream()
            .map(member -> member.getAdditionalFields().get(MAP_TARGET))
            .collect(Collectors.toSet());

    // Identify ARTG to be added
    externalIdentifiers.stream()
        .filter(identifier -> shouldAddArtg(existingMapTargets, identifier))
        .forEach(
            identifier ->
                artgToBeAdded.add(
                    createSnowstormReferenceSetMemberViewComponent(identifier, productId)));

    // Identify ARTG to be removed
    existingMembers.stream()
        .filter(member -> shouldRemoveArtg(member, externalIdentifiers))
        .forEach(artgToBeRemoved::add);
  }

  private boolean shouldAddArtg(Set<String> existingMapTargets, ExternalIdentifier newArtg) {
    return !existingMapTargets.contains(newArtg.getIdentifierValue());
  }

  private boolean shouldRemoveArtg(
      SnowstormReferenceSetMember existingMember, Set<ExternalIdentifier> externalIdentifiers) {
    String existingTarget = existingMember.getAdditionalFields().get(MAP_TARGET);
    return externalIdentifiers.stream()
        .noneMatch(identifier -> identifier.getIdentifierValue().equals(existingTarget));
  }
}
