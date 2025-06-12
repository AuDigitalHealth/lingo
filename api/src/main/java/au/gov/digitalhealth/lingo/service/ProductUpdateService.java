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
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ReferenceSetDefinition;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductPropertiesUpdateRequest;
import au.gov.digitalhealth.lingo.util.NonDefiningPropertiesConverter;
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

  private static String getIdentifierKey(ExternalIdentifierDefinition m, ExternalIdentifier id) {
    return m.getIdentifier()
        + " "
        + (id.getValue() == null ? id.getValueObject().getConceptId() : id.getValue());
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
      NonDefiningPropertyDefinition nonDefiningPropertyDefinition, NonDefiningProperty prop) {

    final String value =
        prop.getValue() == null ? prop.getValueObject().getConceptId() : prop.getValue();

    return nonDefiningPropertyDefinition.getIdentifier() + " " + value;
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
        return toSnowstormConceptMini(updatedConcept);
      } catch (WebClientResponseException ex) {

        String errorBody = ex.getResponseBodyAsString();

        throw new ProductAtomicDataValidationProblem(String.format("%s", errorBody));
      }
    }
    return toSnowstormConceptMini(existingConcepts.get(0));
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
    SnowstormConceptView conceptNeedToUpdate = toSnowstormConceptView(existingConcept);

    String fsn =
        getFsnFromDescriptions(productDescriptionUpdateRequest.getDescriptions()).getTerm();
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

  public Collection<NonDefiningBase> updateProductProperties(
      String branch,
      String conceptId,
      ProductPropertiesUpdateRequest productPropertiesUpdateRequest)
      throws InterruptedException {

    HashSet<NonDefiningBase> nonDefiningBaseSet = new HashSet<>();

    // Handle external identifiers and reference sets
    nonDefiningBaseSet.addAll(
        handleExternalIdentifiersAndReferenceSets(
            branch, conceptId, productPropertiesUpdateRequest));
    // Handle non-defining properties
    nonDefiningBaseSet.addAll(
        handleNonDefiningProperties(branch, conceptId, productPropertiesUpdateRequest));
    return nonDefiningBaseSet;
  }

  private Collection<NonDefiningBase> handleExternalIdentifiersAndReferenceSets(
      String branch,
      String conceptId,
      ProductPropertiesUpdateRequest productPropertiesUpdateRequest)
      throws InterruptedException {
    Map<String, ExternalIdentifierDefinition> mappingRefsets =
        models.getModelConfiguration(branch).getMappingsByName();
    Map<String, ReferenceSetDefinition> referenceSetDefinitionMap =
        models.getModelConfiguration(branch).getReferenceSetsByName();

    Map<String, NonDefiningBase> requestedExternalIdentifiers =
        productPropertiesUpdateRequest.getNonDefiningProperties().stream()
            .filter(
                id ->
                    mappingRefsets.containsKey(id.getIdentifierScheme())
                        || referenceSetDefinitionMap.containsKey(id.getIdentifierScheme()))
            .collect(
                Collectors.toMap(
                    id ->
                        mappingRefsets.get(id.getIdentifierScheme()) == null
                            ? id.getIdentifierScheme()
                            : getIdentifierKey(
                                mappingRefsets.get(id.getIdentifierScheme()),
                                (ExternalIdentifier) id),
                    id -> id));

    Map<String, SnowstormReferenceSetMember> existingMembers =
        snowstormClient
            .getRefsetMembers(
                branch,
                Set.of(conceptId),
                mappingRefsets.values().stream()
                    .map(ExternalIdentifierDefinition::getIdentifier)
                    .collect(Collectors.toSet()))
            .stream()
            .filter(r -> r.getActive() != null && r.getActive())
            .collect(Collectors.toMap(ProductUpdateService::getIdentifierKey, r -> r));

    Set<SnowstormReferenceSetMember> idsToBeRemoved =
        existingMembers.entrySet().stream()
            .filter(entry -> !requestedExternalIdentifiers.containsKey(entry.getKey()))
            .map(Entry::getValue)
            .collect(Collectors.toSet());

    Set<SnowstormReferenceSetMemberViewComponent> idsToBeAdded =
        requestedExternalIdentifiers.entrySet().stream()
            .filter(entry -> !existingMembers.containsKey(entry.getKey()))
            .map(
                entry ->
                    createSnowstormReferenceSetMemberViewComponent(
                        entry.getValue(),
                        conceptId,
                        mappingRefsets.values(),
                        referenceSetDefinitionMap.values()))
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

  public Collection<NonDefiningProperty> handleNonDefiningProperties(
      String branch, String conceptId, @Valid ProductPropertiesUpdateRequest updateRequest) {

    Map<String, NonDefiningPropertyDefinition> nonDefiningPropertiesByName =
        models.getModelConfiguration(branch).getNonDefiningPropertiesByName();

    Map<String, NonDefiningProperty> requestedProperties =
        updateRequest.getNonDefiningProperties().stream()
            .filter(prop -> nonDefiningPropertiesByName.containsKey(prop.getIdentifierScheme()))
            .map(p -> (NonDefiningProperty) p)
            .collect(
                Collectors.toMap(
                    prop ->
                        getNonDefiningPropertyKey(
                            nonDefiningPropertiesByName.get(prop.getIdentifierScheme()), prop),
                    prop -> prop));

    Set<String> definedTypeIds =
        nonDefiningPropertiesByName.values().stream()
            .map(NonDefiningPropertyDefinition::getIdentifier)
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
          branch, conceptId, toSnowstormConceptView(browserConcept), false);
    }

    return requestedProperties.values();
  }
}
