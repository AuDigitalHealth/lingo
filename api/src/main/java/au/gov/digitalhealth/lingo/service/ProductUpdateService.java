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

import static au.gov.digitalhealth.lingo.util.SemanticTagUtil.extractSemanticTag;
import static au.gov.digitalhealth.lingo.util.SnomedConstants.MAP_TARGET;
import static au.gov.digitalhealth.lingo.util.SnowstormDtoUtil.*;
import static java.lang.Boolean.TRUE;

import au.csiro.snowstorm_client.model.*;
import au.gov.digitalhealth.lingo.configuration.FieldBindingConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.MappingRefset;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductExternalIdentifierUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductNonDefiningPropertyUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductReferenceSetUpdateRequest;
import au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter;
import au.gov.digitalhealth.lingo.util.SnowstormDtoUtil;
import au.gov.digitalhealth.tickets.service.TicketServiceImpl;
import jakarta.validation.Valid;
import java.util.*;
import java.util.Map.Entry;
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

  private static String getIdentifierKey(MappingRefset m, ExternalIdentifier id) {
    return m.getIdentifier()
        + " "
        + (id.getIdentifierValue() == null
            ? id.getIdentifierValueObject().getConceptId()
            : id.getIdentifierValue());
  }

  private static String getIdentifierKey(SnowstormReferenceSetMember id) {
    if (id.getAdditionalFields() == null
        || !id.getAdditionalFields().containsKey(MAP_TARGET.getValue())) {
      throw new ProductAtomicDataValidationProblem(
          "Mapping refset member does not contain a map target: " + id);
    }
    return id.getRefsetId() + " " + id.getAdditionalFields().get(MAP_TARGET.getValue());
  }

  private static String getNonDefiningPropertyKeyForRelationship(
      SnowstormRelationship relationship) {
    String value;
    if (TRUE.equals(relationship.getConcrete())) {
      if (relationship.getConcreteValue() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Concrete value is null for relationship: " + relationship);
      }
      value = relationship.getConcreteValue().getValue();
    } else {
      if (relationship.getDestinationId() == null) {
        throw new ProductAtomicDataValidationProblem(
            "Destination ID is null for relationship: " + relationship);
      }
      value = relationship.getDestinationId();
    }

    return relationship.getTypeId() + " " + value;
  }

  private static String getNonDefiningPropertyKey(
      au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty nonDefiningProperty,
      NonDefiningProperty prop) {

    final String value =
        prop.getValue() == null ? prop.getValueObject().getConceptId() : prop.getValue();

    return nonDefiningProperty.getIdentifier() + " " + value;
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

  public Collection<ExternalIdentifier> updateProductExternalIdentifiers(
      String branch,
      String conceptId,
      @Valid ProductExternalIdentifierUpdateRequest productExternalIdentifierUpdateRequest)
      throws InterruptedException {

    Map<String, MappingRefset> mappingRefsets =
        models.getModelConfiguration(branch).getMappingsByName();

    Map<String, ExternalIdentifier> requestedExternalIdentifiers =
        productExternalIdentifierUpdateRequest.getExternalIdentifiers().stream()
            .filter(id -> mappingRefsets.containsKey(id.getIdentifierScheme()))
            .collect(
                Collectors.toMap(
                    id -> getIdentifierKey(mappingRefsets.get(id.getIdentifierScheme()), id),
                    id -> id));

    Map<String, SnowstormReferenceSetMember> existingMembers =
        snowstormClient
            .getRefsetMembers(
                branch,
                Set.of(conceptId),
                mappingRefsets.values().stream()
                    .map(MappingRefset::getIdentifier)
                    .collect(Collectors.toSet()))
            .stream()
            .filter(r -> r.getActive() != null && r.getActive())
            .collect(Collectors.toMap(ProductUpdateService::getIdentifierKey, r -> r));

    Set<SnowstormReferenceSetMember> idsToBeRemoved =
        existingMembers.entrySet().stream()
            .filter(entry -> !requestedExternalIdentifiers.containsKey(entry.getKey()))
            .map(Map.Entry::getValue)
            .collect(Collectors.toSet());

    Set<SnowstormReferenceSetMemberViewComponent> idsToBeAdded =
        requestedExternalIdentifiers.entrySet().stream()
            .filter(entry -> !existingMembers.containsKey(entry.getKey()))
            .map(
                entry ->
                    createSnowstormReferenceSetMemberViewComponent(
                        entry.getValue(), conceptId, mappingRefsets.values()))
            .collect(Collectors.toSet());

    if (!idsToBeAdded.isEmpty()) {
      // Create new members in Snowstorm
      snowstormClient.createRefsetMembers(branch, List.copyOf(idsToBeAdded));
    }

    if (!idsToBeRemoved.isEmpty()) {
      // Remove outdated members from Snowstorm
      snowstormClient.removeRefsetMembers(branch, idsToBeRemoved);
    }

    return requestedExternalIdentifiers.values();
  }

  public Collection<ReferenceSet> updateProductReferenceSets(
      String branch,
      String conceptId,
      @Valid ProductReferenceSetUpdateRequest productReferenceSetUpdateRequest)
      throws InterruptedException {

    Map<String, au.gov.digitalhealth.lingo.configuration.model.ReferenceSet> referenceSetMap =
        models.getModelConfiguration(branch).getReferenceSetsByName();

    Map<String, ReferenceSet> requestedRefsets =
        productReferenceSetUpdateRequest.getReferenceSets().stream()
            .filter(refset -> referenceSetMap.containsKey(refset.getIdentifierScheme()))
            .collect(
                Collectors.toMap(
                    id -> referenceSetMap.get(id.getIdentifierScheme()).getIdentifier(), id -> id));

    Map<String, SnowstormReferenceSetMember> existingMembers =
        snowstormClient
            .getRefsetMembers(
                branch,
                Set.of(conceptId),
                referenceSetMap.values().stream()
                    .map(au.gov.digitalhealth.lingo.configuration.model.ReferenceSet::getIdentifier)
                    .collect(Collectors.toSet()))
            .stream()
            .filter(r -> r.getActive() != null && r.getActive())
            .collect(Collectors.toMap(SnowstormReferenceSetMember::getRefsetId, r -> r));

    Set<SnowstormReferenceSetMember> idsToBeRemoved =
        existingMembers.entrySet().stream()
            .filter(entry -> !requestedRefsets.containsKey(entry.getKey()))
            .map(Map.Entry::getValue)
            .collect(Collectors.toSet());

    // create a list of SnowstormReferenceSetMember in requestedExternalIdentifiers where the
    // requestedExternalIdentifiers key is not present in existingMembers keyset
    Set<SnowstormReferenceSetMemberViewComponent> idsToBeAdded =
        requestedRefsets.entrySet().stream()
            .filter(entry -> !existingMembers.containsKey(entry.getKey()))
            .map(
                entry ->
                    createSnowstormReferenceSetMemberViewComponent(
                        entry.getValue(), conceptId, referenceSetMap.values()))
            .collect(Collectors.toSet());

    if (!idsToBeAdded.isEmpty()) {
      // Create new members in Snowstorm
      snowstormClient.createRefsetMembers(branch, List.copyOf(idsToBeAdded));
    }

    if (!idsToBeRemoved.isEmpty()) {
      // Remove outdated members from Snowstorm
      snowstormClient.removeRefsetMembers(branch, idsToBeRemoved);
    }

    return requestedRefsets.values();
  }

  public Collection<NonDefiningProperty> updateProductNonDefiningProperties(
      String branch,
      String conceptId,
      @Valid ProductNonDefiningPropertyUpdateRequest productNonDefiningPropertyUpdateRequest) {

    Map<String, au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty>
        nonDefiningPropertiesByName =
            models.getModelConfiguration(branch).getNonDefiningPropertiesByName();

    Map<String, NonDefiningProperty> requestedProperties =
        productNonDefiningPropertyUpdateRequest.getNonDefiningProperties().stream()
            .filter(prop -> nonDefiningPropertiesByName.containsKey(prop.getIdentifierScheme()))
            .collect(
                Collectors.toMap(
                    prop ->
                        getNonDefiningPropertyKey(
                            nonDefiningPropertiesByName.get(prop.getIdentifierScheme()), prop),
                    prop -> prop));

    Set<String> definedTypeIds =
        nonDefiningPropertiesByName.values().stream()
            .map(au.gov.digitalhealth.lingo.configuration.model.NonDefiningProperty::getIdentifier)
            .collect(Collectors.toSet());

    final SnowstormConcept browserConcept =
        snowstormClient.getBrowserConcepts(branch, Set.of(conceptId)).blockFirst();

    if (browserConcept == null) {
      throw new ProductAtomicDataValidationProblem(
          "Concept with ID " + conceptId + " does not exist in branch " + branch);
    }

    Map<String, SnowstormRelationship> existingProperties =
        browserConcept.getRelationships().stream()
            .filter(
                r ->
                    r.getActive() != null
                        && r.getActive()
                        && definedTypeIds.contains(r.getTypeId()))
            .collect(
                Collectors.toMap(
                    ProductUpdateService::getNonDefiningPropertyKeyForRelationship, r -> r));

    Set<SnowstormRelationship> idsToBeRemoved =
        existingProperties.entrySet().stream()
            .filter(entry -> !requestedProperties.containsKey(entry.getKey()))
            .map(Entry::getValue)
            .collect(Collectors.toSet());

    Set<SnowstormRelationship> idsToBeAdded =
        requestedProperties.entrySet().stream()
            .filter(entry -> !existingProperties.containsKey(entry.getKey()))
            .map(
                entry ->
                    NonDefiningPropertiesConverter.calculateNonDefiningRelationships(
                        entry.getValue(),
                        conceptId,
                        nonDefiningPropertiesByName.values(),
                        models.getModelConfiguration(branch).getModuleId()))
            .collect(Collectors.toSet());

    if (!idsToBeAdded.isEmpty() || !idsToBeRemoved.isEmpty()) {

      browserConcept.getRelationships().removeAll(idsToBeRemoved);
      browserConcept.getRelationships().addAll(idsToBeAdded);
      snowstormClient.updateConcept(
          branch, conceptId, SnowstormDtoUtil.toSnowstormConceptView(browserConcept), false);
    }

    return requestedProperties.values();
  }
}
