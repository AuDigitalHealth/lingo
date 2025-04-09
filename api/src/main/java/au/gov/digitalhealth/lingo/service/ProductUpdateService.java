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
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.*;

import au.csiro.snowstorm_client.model.*;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.bulk.ProductUpdateCreationDetails;
import au.gov.digitalhealth.lingo.product.details.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductExternalIdentifierUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductUpdateState;
import au.gov.digitalhealth.lingo.util.AmtConstants;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.tickets.models.BulkProductAction;
import au.gov.digitalhealth.tickets.models.Ticket;
import au.gov.digitalhealth.tickets.repository.BulkProductActionRepository;
import au.gov.digitalhealth.tickets.repository.TicketRepository;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Log
@Service
public class ProductUpdateService {

  SnowstormClient snowstormClient;

  TicketServiceImpl ticketService;

  TicketRepository ticketRepository;
  FieldBindingConfiguration fieldBindingConfiguration;

  BulkProductActionRepository bulkProductActionRepository;

  public ProductUpdateService(
      SnowstormClient snowstormClient,
      TicketServiceImpl ticketService,
      FieldBindingConfiguration fieldBindingConfiguration,
      TicketRepository ticketRepository,
      BulkProductActionRepository bulkProductActionRepository) {
    this.snowstormClient = snowstormClient;

    this.ticketService = ticketService;
    this.fieldBindingConfiguration = fieldBindingConfiguration;
    this.ticketRepository = ticketRepository;
    this.bulkProductActionRepository = bulkProductActionRepository;
  }

  public BulkProductAction updateProduct(
      String branch, String productId, @Valid ProductUpdateRequest productUpdateRequest)
      throws InterruptedException {

    ProductDescriptionUpdateRequest productDescriptionUpdateRequest =
        productUpdateRequest.getDescriptionUpdate();
    ProductExternalIdentifierUpdateRequest productExternalIdentifierUpdateRequest =
        productUpdateRequest.getExternalRequesterUpdate();
    Ticket ticket = ticketRepository.findById(productUpdateRequest.getTicketId()).orElseThrow();
    String fsn =
        getFsnFromDescriptions(productDescriptionUpdateRequest.getDescriptions()).getTerm();
    BulkProductAction productUpdate = BulkProductAction.builder().ticket(ticket).name(fsn).build();
    ProductUpdateState historicState = ProductUpdateState.builder().build();
    ProductUpdateState updateState = ProductUpdateState.builder().build();
    ProductUpdateCreationDetails productUpdateCreationDetails =
        ProductUpdateCreationDetails.builder()
            .productId(productId)
            .historicState(historicState)
            .updatedState(updateState)
            .build();

    updateProductDescriptions(
        branch, productId, productDescriptionUpdateRequest, productUpdateCreationDetails);

    if (productExternalIdentifierUpdateRequest != null) {
      updateProductExternalIdentifiers(
          branch, productId, productExternalIdentifierUpdateRequest, productUpdateCreationDetails);
    }

    productUpdate.setDetails(productUpdateCreationDetails);

    Optional<BulkProductAction> existingBulkProductAction =
        bulkProductActionRepository.findByNameAndTicketId(
            productUpdate.getName(), productUpdateRequest.getTicketId());
    if (existingBulkProductAction.isPresent()) {
      productUpdate.setName(productUpdate.getName() + Instant.now().toString());
    }
    return bulkProductActionRepository.save(productUpdate);
  }

  public ProductUpdateCreationDetails updateProductDescriptions(
      String branch,
      String productId,
      @Valid ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      ProductUpdateCreationDetails productUpdateCreationDetails) {

    List<SnowstormConcept> existingConcepts = fetchBrowserConcepts(branch, Set.of(productId));

    SnowstormConceptView existingConceptView =
        SnowstormDtoUtil.toSnowstormConceptView(existingConcepts.get(0));

    productUpdateCreationDetails.getHistoricState().setConcept(existingConceptView);

    Map<SnowstormDescription, SnowstormDescription> retireReplaceDescriptions =
        getDescriptionsNeedingRetireReplace(existingConceptView, productDescriptionUpdateRequest);

    if (!retireReplaceDescriptions.isEmpty()) {
      // Create a map for quick lookup of keys by descriptionId
      Map<String, SnowstormDescription> keyDescriptionsById =
          retireReplaceDescriptions.keySet().stream()
              .filter(desc -> desc.getDescriptionId() != null)
              .collect(
                  Collectors.toMap(SnowstormDescription::getDescriptionId, Function.identity()));

      // Create a new set to hold the updated descriptions
      Set<SnowstormDescription> updatedDescriptions = new HashSet<>();

      // Process each description in the request
      for (SnowstormDescription description : productDescriptionUpdateRequest.getDescriptions()) {
        String descriptionId = description.getDescriptionId();

        // If this matches a key in retireReplaceDescriptions, replace it
        if (descriptionId != null && keyDescriptionsById.containsKey(descriptionId)) {
          // Add the original description from the key set
          updatedDescriptions.add(keyDescriptionsById.get(descriptionId));

          // Find the corresponding value
          SnowstormDescription valueDescription = null;
          for (Map.Entry<SnowstormDescription, SnowstormDescription> entry :
              retireReplaceDescriptions.entrySet()) {
            if (descriptionId.equals(entry.getKey().getDescriptionId())) {
              valueDescription = entry.getValue();
              break;
            }
          }

          // Create a new description based on the value with type SYNONYM
          if (valueDescription != null) {
            SnowstormDescription synonymDesc = new SnowstormDescription();
            // Copy all properties from valueDescription
            BeanUtils.copyProperties(valueDescription, synonymDesc);
            // Set type to SYNONYM
            synonymDesc.setType("SYNONYM");
            synonymDesc.setDescriptionId(null);
            synonymDesc.setReleased(false);
            synonymDesc.setTypeId("900000000000013009");
            // Add the new SYNONYM description
            updatedDescriptions.add(synonymDesc);
          }
        } else {
          // Keep descriptions that don't need replacement
          updatedDescriptions.add(description);
        }
      }

      // Update the request with the modified descriptions
      productDescriptionUpdateRequest.setDescriptions(updatedDescriptions);
    }

    SnowstormConceptView conceptsNeedUpdate =
        prepareConceptUpdate(existingConceptView, productDescriptionUpdateRequest, branch);

    productUpdateCreationDetails.getUpdatedState().setConcept(conceptsNeedUpdate);

    boolean areDescriptionsModified =
        productDescriptionUpdateRequest.areDescriptionsModified(
            existingConceptView.getDescriptions());

    if (!areDescriptionsModified) {
      return productUpdateCreationDetails;
    }

    if (conceptsNeedUpdate != null) {
      try {
        SnowstormConceptView response =
            snowstormClient.updateConcept(
                branch, conceptsNeedUpdate.getConceptId(), conceptsNeedUpdate, false);
        productUpdateCreationDetails.getUpdatedState().setConcept(response);

        if (!retireReplaceDescriptions.isEmpty()) {

          Set<SnowstormDescription> descriptionsWithRetireReplaceCompleted = new HashSet<>();
          response
              .getDescriptions()
              .forEach(
                  desc -> {
                    Optional<SnowstormDescription> descriptionForRetirement =
                        retireReplaceDescriptions.keySet().stream()
                            .filter(
                                key ->
                                    key.getDescriptionId() != null
                                        && key.getDescriptionId().equals(desc.getDescriptionId()))
                            .findFirst();

                    Optional<SnowstormDescription> isAReplacementDescription =
                        retireReplaceDescriptions.values().stream()
                            .filter(
                                key ->
                                    key.getTerm() != null && key.getTerm().equals(desc.getTerm()))
                            .findFirst();

                    if (!descriptionForRetirement.isEmpty()) {
                      // Get the matching key and its corresponding value from
                      // retireReplaceDescriptions
                      SnowstormDescription keyDescription = descriptionForRetirement.get();
                      SnowstormDescription valueDescription =
                          retireReplaceDescriptions.get(keyDescription);

                      // Find the description in response that has the same term as valueDescription
                      Optional<SnowstormDescription> matchingValueDesc =
                          response.getDescriptions().stream()
                              .filter(
                                  responseDesc ->
                                      valueDescription.getTerm() != null
                                          && valueDescription
                                              .getTerm()
                                              .equals(responseDesc.getTerm()))
                              .findFirst();

                      if (matchingValueDesc.isPresent()) {
                        // add the replaced by
                        Map<String, Set<String>> replacedBy = new HashMap<>();
                        Set<String> replacementIds = new HashSet<>();
                        SnowstormDescription matchingDesc = matchingValueDesc.get();
                        replacementIds.add(
                            matchingDesc.getDescriptionId()); // Add the replacement ID
                        replacedBy.put("REPLACED_BY", replacementIds);

                        // Set the association targets on the description
                        SnowstormDescription unwrappedDescriptionForRetirement =
                            descriptionForRetirement.get();
                        unwrappedDescriptionForRetirement.setAssociationTargets(replacedBy);
                        unwrappedDescriptionForRetirement.setActive(false);
                        unwrappedDescriptionForRetirement.setAcceptabilityMap(new HashMap<>());

                        // Add to the completed set
                        descriptionsWithRetireReplaceCompleted.add(
                            unwrappedDescriptionForRetirement);
                      } else {
                        // If no matching term found, add the original description
                        descriptionsWithRetireReplaceCompleted.add(desc);
                      }
                    } else if (isAReplacementDescription.isPresent()) {
                      SnowstormDescription replacement = isAReplacementDescription.get();
                      replacement.setDescriptionId(desc.getDescriptionId());
                      replacement.setReleased(false);
                      descriptionsWithRetireReplaceCompleted.add(replacement);
                    } else {
                      descriptionsWithRetireReplaceCompleted.add(desc);
                    }
                  });

          conceptsNeedUpdate.setDescriptions(descriptionsWithRetireReplaceCompleted);
          SnowstormConceptView response2 =
              snowstormClient.updateConcept(
                  branch, conceptsNeedUpdate.getConceptId(), conceptsNeedUpdate, false);
          productUpdateCreationDetails.getUpdatedState().setConcept(response2);
        }
      } catch (WebClientResponseException ex) {

        String errorBody = ex.getResponseBodyAsString();

        throw new ProductAtomicDataValidationProblem(String.format("%s", errorBody));
      }
    }

    return productUpdateCreationDetails;
  }

  private SnowstormConceptView prepareConceptUpdate(
      SnowstormConceptView existingConcept,
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest,
      String branch) {
    if (productDescriptionUpdateRequest == null) return null;

    SnowstormConceptView conceptNeedToUpdate = SnowstormDtoUtil.cloneConceptView(existingConcept);

    String fsn =
        SnowstormDtoUtil.getFsnFromDescriptions(productDescriptionUpdateRequest.getDescriptions())
            .getTerm();
    String existingFsn = conceptNeedToUpdate.getFsn().getTerm();
    if (fsn != null && existingFsn != null && !existingFsn.equals(fsn.trim())) {
      String newFsn = fsn.trim();

      snowstormClient.checkForDuplicateFsn(newFsn, branch);
    }

    conceptNeedToUpdate.setDescriptions(productDescriptionUpdateRequest.getDescriptions());

    return conceptNeedToUpdate;
  }

  private Map<SnowstormDescription, SnowstormDescription> getDescriptionsNeedingRetireReplace(
      SnowstormConceptView existingConcept,
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest) {
    if (productDescriptionUpdateRequest == null || existingConcept == null) {
      return Collections.emptyMap();
    }

    Map<String, SnowstormDescription> existingDescriptionsById =
        existingConcept.getDescriptions().stream()
            .collect(Collectors.toMap(SnowstormDescription::getDescriptionId, Function.identity()));

    Map<SnowstormDescription, SnowstormDescription> descriptionsNeedingUpdate = new HashMap<>();

    for (SnowstormDescription newDescription : productDescriptionUpdateRequest.getDescriptions()) {
      String descriptionId = newDescription.getDescriptionId();
      if (descriptionId != null && existingDescriptionsById.containsKey(descriptionId)) {
        SnowstormDescription oldDescription = existingDescriptionsById.get(descriptionId);

        // Check if both are released and term has changed
        if (oldDescription != null
            && newDescription != null
            && Boolean.TRUE.equals(oldDescription.getReleased())
            && Boolean.TRUE.equals(newDescription.getReleased())
            && !Objects.equals(oldDescription.getTerm(), newDescription.getTerm())) {

          descriptionsNeedingUpdate.put(oldDescription, newDescription);
        }
      }
    }

    return descriptionsNeedingUpdate;
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
      @Valid ProductExternalIdentifierUpdateRequest productExternalIdentifierUpdateRequest,
      ProductUpdateCreationDetails productUpdateCreationDetails)
      throws InterruptedException {
    Set<ExternalIdentifier> externalIdentifiers =
        productExternalIdentifierUpdateRequest.getExternalIdentifiers();

    // Prepare collections for changes
    Set<SnowstormReferenceSetMember> artgToBeRemoved = new HashSet<>();
    Set<SnowstormReferenceSetMemberViewComponent> artgToBeAdded = new HashSet<>();

    // Fetch existing ARTG reference set members
    List<SnowstormReferenceSetMember> existingMembers =
        snowstormClient.getArtgMembers(branch, Set.of(productId));

    Set<ExternalIdentifier> existingIdentifiers = getExternalIdentifiers(branch, productId);

    productUpdateCreationDetails.getHistoricState().setExternalIdentifiers(existingIdentifiers);
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
      snowstormClient.removeRefsetMembers(branch, artgToBeRemoved);
    }
    productUpdateCreationDetails.getUpdatedState().setExternalIdentifiers(externalIdentifiers);
    return externalIdentifiers;
  }

  public Set<ExternalIdentifier> getExternalIdentifiers(String branch, String productId) {
    List<SnowstormReferenceSetMember> existingMembers =
        snowstormClient.getArtgMembers(branch, Set.of(productId));

    Set<ExternalIdentifier> existingIdentifiers =
        existingMembers.stream()
            .map(
                referenceSetMember -> {
                  return ExternalIdentifier.builder()
                      .identifierScheme(AmtConstants.ARTGID_SCHEME.toString())
                      .identifierValue(referenceSetMember.getAdditionalFields().get("mapTarget"))
                      .build();
                })
            .collect(Collectors.toSet());

    return existingIdentifiers;
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
