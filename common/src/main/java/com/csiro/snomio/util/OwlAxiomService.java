package com.csiro.snomio.util;

import static java.lang.Long.parseLong;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.configuration.ModellingConfiguration;
import com.csiro.snomio.exception.OntologyCreationProblem;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.StringWriter;
import java.util.*;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.semanticweb.owlapi.functional.renderer.FunctionalSyntaxObjectRenderer;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLLogicalAxiom;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.snomed.otf.owltoolkit.constants.Concepts;
import org.snomed.otf.owltoolkit.conversion.AxiomRelationshipConversionService;
import org.snomed.otf.owltoolkit.domain.Relationship;
import org.snomed.otf.owltoolkit.ontology.OntologyService;
import org.snomed.otf.owltoolkit.ontology.render.SnomedPrefixManager;
import org.snomed.otf.owltoolkit.taxonomy.SnomedTaxonomy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Log
@Service
public class OwlAxiomService {
  private final ModellingConfiguration modellingConfiguration;
  private final ObjectMapper mapper;

  @Autowired
  public OwlAxiomService(ObjectMapper mapper, ModellingConfiguration modellingConfiguration) {
    this.mapper = mapper;
    this.modellingConfiguration = modellingConfiguration;
  }

  public Set<String> translate(SnowstormConceptView concept) {

    try {
      log.info("CONCEPT: " + mapper.writeValueAsString(concept));
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }

    SnomedTaxonomy taxonomy = createSnomedTaxonomy(concept);
    Set<Long> ungroupedAttributes = getUngroupedAttributes(taxonomy);
    OntologyService ontologyService = new OntologyService(ungroupedAttributes);

    try {
      log.info("TAXONOMY: " + mapper.writeValueAsString(taxonomy));
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }

    SnomedPrefixManager prefixManager = ontologyService.getSnomedPrefixManager();
    prefixManager.setPrefix("sct", "http://snomed.info/id/");
    prefixManager.setDefaultPrefix("sct");

    AxiomRelationshipConversionService axiomRelConversionService =
        new AxiomRelationshipConversionService(ungroupedAttributes);

    try (StringWriter functionalSyntaxWriter = new StringWriter()) {
      OWLOntology ontology = ontologyService.createOntology(taxonomy);

      FunctionalSyntaxObjectRenderer functionalSyntaxObjectRenderer =
          new FunctionalSyntaxObjectRenderer(ontology, functionalSyntaxWriter);

      functionalSyntaxObjectRenderer.setPrefixManager(prefixManager);

      Set<String> axiomAsOwlF = new HashSet<>();
      for (OWLAxiom axiom : ontology.getAxioms()) {
        axiomAsOwlF.add(axiomRelConversionService.axiomToString((OWLLogicalAxiom) axiom));
      }

      return axiomAsOwlF;
    } catch (IOException | OWLOntologyCreationException e) {
      log.log(
          Level.SEVERE,
          "Failed creating ontology to generate name for conceot " + concept.getConceptId(),
          e);
      throw new OntologyCreationProblem(concept.getConceptId(), e);
    }
  }

  private Set<Long> getUngroupedAttributes(SnomedTaxonomy taxonomy) {
    return taxonomy.getUngroupedRolesForContentTypeOrDefault(
        parseLong(Concepts.ALL_PRECOORDINATED_CONTENT));
  }

  private SnomedTaxonomy createSnomedTaxonomy(SnowstormConceptView concept) {
    long conceptId = toNumericId(concept.getConceptId());
    SnomedTaxonomy taxonomy = new SnomedTaxonomy();
    modellingConfiguration
        .getUngroupedRelationshipTypes()
        .forEach(
            cid ->
                taxonomy.addUngroupedRole(
                    Long.parseLong(Concepts.ALL_PRECOORDINATED_CONTENT), cid));
    taxonomy.getAllConceptIds().add(conceptId);
    if (!concept.getDefinitionStatusId().equals(Concepts.PRIMITIVE)) {
      taxonomy.getFullyDefinedConceptIds().add(conceptId);
    }

    long relid = 0;

    for (SnowstormAxiom axiom : concept.getClassAxioms()) {
      for (SnowstormRelationship relationship : axiom.getRelationships()) {
        if ((relationship.getActive() == null || relationship.getActive())
            && !relationship
                .getCharacteristicType()
                .equals(Concepts.ADDITIONAL_RELATIONSHIP_LONG.toString())) {
          // ----below is from SNINT code with minor adaptations----

          boolean universal =
              relationship.getModifierId() != null
                  && relationship.getModifierId().equals(Concepts.UNIVERSAL_RESTRICTION_MODIFIER);
          int unionGroup = 0;
          if (!relationship.getConcrete()) {
            taxonomy.addOrModifyRelationship(
                relationship.getInferred() == null || !relationship.getInferred(),
                conceptId,
                new org.snomed.otf.owltoolkit.domain.Relationship(
                    relid++,
                    relationship.getEffectiveTime() != null
                        ? Integer.parseInt(relationship.getEffectiveTime())
                        : (int) new Date().getTime(),
                    toNumericId(relationship.getModuleId()),
                    toNumericId(relationship.getTypeId()),
                    toNumericId(relationship.getDestinationId()),
                    relationship.getGroupId(),
                    unionGroup,
                    universal,
                    toNumericId(relationship.getCharacteristicType())));
          } else {
            SnowstormConcreteValue snCV = Objects.requireNonNull(relationship.getConcreteValue());
            taxonomy.addOrModifyRelationship(
                relationship.getInferred() == null || !relationship.getInferred(),
                conceptId,
                new org.snomed.otf.owltoolkit.domain.Relationship(
                    relid++,
                    relationship.getEffectiveTime() != null
                        ? Integer.parseInt(relationship.getEffectiveTime())
                        : (int) new Date().getTime(),
                    toNumericId(relationship.getModuleId()),
                    toNumericId(relationship.getTypeId()),
                    new org.snomed.otf.owltoolkit.domain.Relationship.ConcreteValue(
                        Relationship.ConcreteValue.Type.valueOf(
                            Objects.requireNonNull(snCV.getDataType()).getValue()),
                        Objects.requireNonNull(snCV.getValue())),
                    relationship.getGroupId(),
                    unionGroup,
                    universal,
                    toNumericId(relationship.getCharacteristicType())));
          }
        }
      }
    }
    return taxonomy;
  }

  private Long toNumericId(String id) {
    return Long.parseLong(id);
  }
}
