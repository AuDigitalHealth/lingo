package com.csiro.snomio.util;

import au.csiro.snowstorm_client.model.SnowstormAxiom;
import au.csiro.snowstorm_client.model.SnowstormConceptView;
import au.csiro.snowstorm_client.model.SnowstormConcreteValue;
import au.csiro.snowstorm_client.model.SnowstormRelationship;
import com.csiro.snomio.service.AtomicCache;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
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

import java.io.IOException;
import java.io.StringWriter;
import java.math.BigInteger;
import java.util.*;
import java.util.stream.Collectors;

import static java.lang.Long.parseLong;

@Log
@Service
public class OwlAxiomService {

  ObjectMapper mapper = new ObjectMapper();
  public static final String DEFAULT_UNGROUPED_RELS =
      "116680003,784276002,774159003,766953001,738774007,736473005,766939001,"
          + "733930001,272741003,736475003,774081006,736518005,411116001,766952006,726542003,766954007,733932009,"
          + "774158006,736474004,736472000,30394011000036104,30465011000036106,30523011000036108,700000061000036106,"
          + "700000071000036103,700000091000036104,700000101000036108,733933004,763032000,733928003,733931002,736476002";

  private static final Map<Long, Long> AXIOM_AUTHORING_MODULES =
      new Gson()
          .fromJson(
              System.getProperty(
                  "axiom.authoring.modules",
                  "{\n"
                      + "  \"449079008\": \"449079008\",\n"
                      + "  \"449080006\": \"449080006\",\n"
                      + "  \"449081005\": \"449081005\",\n"
                      + "  \"466707005\": \"466707005\",\n"
                      + "  \"705115006\": \"705115006\",\n"
                      + "  \"32506021000036107\": \"32506021000036107\",\n"
                      + "  \"161771000036108\": \"161771000036108\",\n"
                      + "  \"900062011000036108\": \"900062011000036108\",\n"
                      + "  \"900000000000012004\": \"161771000036108\",\n"
                      + "  \"900000000000207008\": \"32506021000036107\",\n"
                      + "  \"32570491000036106\": \"32570491000036106\",\n"
                      + "  \"341000168102\": \"341000168102\",\n"
                      + "  \"351000168100\": \"351000168100\"\n"
                      + "}"),
              new TypeToken<Map<Long, Long>>() {}.getType());

  @Autowired
  public OwlAxiomService() {}

  public Set<String> translate(SnowstormConceptView concept, AtomicCache atomicCache) {

    try {
      log.info("CONCEPT: " + mapper.writeValueAsString(concept));
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }

    SnomedTaxonomy taxonomy = createSnomedTaxonomy(concept, atomicCache);
    Set<Long> ungroupedArributes = getUngroupedAttributes(taxonomy);
    OntologyService ontologyService = new OntologyService(ungroupedArributes);

    try {
      log.info("TAXONOMY: " + mapper.writeValueAsString(taxonomy));
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }

    SnomedPrefixManager prefixManager = ontologyService.getSnomedPrefixManager();
    prefixManager.setPrefix("sct", "http://snomed.info/id/");
    prefixManager.setDefaultPrefix("sct");

    AxiomRelationshipConversionService axiomRelConversionService =
        new AxiomRelationshipConversionService(ungroupedArributes);

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
      throw new RuntimeException(
          "Failed to create OWL Ontology to calculate axioms for " + concept.getConceptId(), e);
    }
  }

  private Set<Long> getUngroupedAttributes(SnomedTaxonomy taxonomy) {
    return taxonomy.getUngroupedRolesForContentTypeOrDefault(
        parseLong(Concepts.ALL_PRECOORDINATED_CONTENT));
  }

  private SnomedTaxonomy createSnomedTaxonomy(
      SnowstormConceptView concept, AtomicCache atomicCache) {
    Long conceptId = toNumericId(concept.getConceptId(), atomicCache);
    SnomedTaxonomy taxonomy = new SnomedTaxonomy();
    List<BigInteger> ungroupedIds = null;
    String ungrouped =
        System.getProperty("default.mrcm.ungrouped", OwlAxiomService.DEFAULT_UNGROUPED_RELS);
    ungroupedIds =
        Arrays.stream(ungrouped.split(","))
            .map(id -> BigInteger.valueOf(Long.parseLong(id)))
            .collect(Collectors.toList());
    ungroupedIds.forEach(
        cid ->
            taxonomy.addUngroupedRole(
                Long.parseLong(Concepts.ALL_PRECOORDINATED_CONTENT), cid.longValue()));
    taxonomy.getAllConceptIds().add(conceptId);
    if (!concept.getDefinitionStatusId().equals(Concepts.PRIMITIVE)) {
      taxonomy.getFullyDefinedConceptIds().add(conceptId);
    }

    int ungroupedGroupValue = 0;
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

          int relationshipGroup =
              relationship.getRelationshipGroup() != null ? relationship.getRelationshipGroup() : 0;
          if (relationshipGroup == 0) {
            relationshipGroup = ungroupedGroupValue;
          }
          taxonomy.addOrModifyRelationship(
              relationship.getInferred() == null || !relationship.getInferred(),
              conceptId,
              new org.snomed.otf.owltoolkit.domain.Relationship(
                  toNumericId(relationship.getId(), atomicCache),
                  relationship.getEffectiveTime() != null
                      ? Integer.parseInt(relationship.getEffectiveTime())
                      : (int) new Date().getTime(),
                  toNumericId(relationship.getModuleId(), atomicCache),
                  toNumericId(relationship.getTypeId(), atomicCache),
                  toNumericId(relationship.getDestinationId(), atomicCache),
                  relationshipGroup,
                  unionGroup,
                  universal,
                  toNumericId(relationship.getCharacteristicType(), atomicCache)));

          if (Boolean.TRUE.equals(relationship.getConcrete())) {
            SnowstormConcreteValue snCV = Objects.requireNonNull(relationship.getConcreteValue());
            taxonomy.addOrModifyRelationship(
                relationship.getInferred() == null || !relationship.getInferred(),
                conceptId,
                new org.snomed.otf.owltoolkit.domain.Relationship(
                    toNumericId(relationship.getId(), atomicCache),
                    relationship.getEffectiveTime() != null
                        ? Integer.parseInt(relationship.getEffectiveTime())
                        : (int) new Date().getTime(),
                    toNumericId(relationship.getModuleId(), atomicCache),
                    toNumericId(relationship.getTypeId(), atomicCache),
                    new org.snomed.otf.owltoolkit.domain.Relationship.ConcreteValue(
                        Relationship.ConcreteValue.Type.valueOf(Objects.requireNonNull(snCV.getDataType()).getValue()),
                        Objects.requireNonNull(snCV.getValue())),
                    relationshipGroup,
                    unionGroup,
                    universal,
                    toNumericId(relationship.getCharacteristicType(), atomicCache)));
          }
        }
      }
    }
    return taxonomy;
  }

  private Long toNumericId(String id, AtomicCache atomicCache) {
    Long numericId = null;
    try {
      numericId = Long.parseLong(id);
    } catch (NumberFormatException e) {
      if (atomicCache.containsTempIdFor(id)) {
        numericId = Long.parseLong(String.valueOf(atomicCache.getTempIdFor(id)));
      } else if (id != null && id.matches("[a-f0-9]{8}(?:-[a-f0-9]{4}){4}[a-f0-9]{8}")) {
        numericId = Long.parseLong(String.valueOf(createTempId(atomicCache)));
        atomicCache.addTempId(id, numericId.toString());
      } else {
        numericId = Long.MIN_VALUE;
      }
    }
    return numericId;
  }

  private String createTempId(AtomicCache atomicCache) {
    String newId = "" + atomicCache.nextNegativeInt();
    while (atomicCache.containsTempId(newId)) {
      newId = "" + atomicCache.nextNegativeInt();
    }
    return newId;
  }
}
