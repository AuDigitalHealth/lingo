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

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import au.csiro.snowstorm_client.model.SnowstormConcept;
import au.csiro.snowstorm_client.model.SnowstormDescription;
import au.gov.digitalhealth.lingo.exception.ProductAtomicDataValidationProblem;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProductUpdateServiceTest {
  private static final String CORE_MODULE_ID = "900000000000207008";
  private static final String EXTENSION_MODULE_ID = "32506021000036107";
  private static final String US_REFSET_ID = "900000000000509007";
  private static final String PROJECT_REFSET_ID = "32570271000036106";
  private static final Set<String> PREFERRED_LANG_REFSETS = Set.of(PROJECT_REFSET_ID);

  @Test
  void rejectsFsnTermEditForCoreConcepts() {
    SnowstormDescription fsn = createFsn("100", "Original FSN");
    SnowstormDescription usPt = createUsPreferredSynonym("200", "Original US PT");
    SnowstormDescription synonym = createSynonym("300", "Allowed synonym");
    SnowstormConcept concept = createConcept(CORE_MODULE_ID, fsn, usPt, synonym);

    SnowstormDescription updatedFsn = createFsn("100", "Updated FSN");
    ProductDescriptionUpdateRequest request =
        ProductDescriptionUpdateRequest.builder()
            .descriptions(Set.of(updatedFsn, usPt, synonym))
            .build();

    assertThatThrownBy(
            () ->
                ProductUpdateService.validateCoreConceptDescriptionsImmutable(
                    concept, request, PREFERRED_LANG_REFSETS))
        .isInstanceOf(ProductAtomicDataValidationProblem.class);
  }

  @Test
  void rejectsNonConfiguredRefsetAcceptabilityChangeForCoreConcepts() {
    SnowstormDescription fsn = createFsn("100", "Original FSN");
    SnowstormDescription usPt = createUsPreferredSynonym("200", "Original US PT");
    SnowstormDescription synonym = createSynonym("300", "Allowed synonym");
    SnowstormConcept concept = createConcept(CORE_MODULE_ID, fsn, usPt, synonym);

    // Change US refset acceptability from PREFERRED to ACCEPTABLE — should be rejected
    SnowstormDescription modifiedUsPt = createSynonym("200", "Original US PT");
    Map<String, String> acceptabilityMap = new HashMap<>();
    acceptabilityMap.put(US_REFSET_ID, "ACCEPTABLE");
    modifiedUsPt.setAcceptabilityMap(acceptabilityMap);
    ProductDescriptionUpdateRequest request =
        ProductDescriptionUpdateRequest.builder()
            .descriptions(Set.of(fsn, modifiedUsPt, synonym))
            .build();

    assertThatThrownBy(
            () ->
                ProductUpdateService.validateCoreConceptDescriptionsImmutable(
                    concept, request, PREFERRED_LANG_REFSETS))
        .isInstanceOf(ProductAtomicDataValidationProblem.class)
        .hasMessageContaining(
            "Cannot change the acceptability for SNOMED International managed language reference sets")
        .hasMessageContaining(PROJECT_REFSET_ID);
  }

  @Test
  void allowsConfiguredRefsetAcceptabilityChangeForCoreConcepts() {
    SnowstormDescription fsn = createFsn("100", "Original FSN");
    SnowstormDescription synonym = createSynonym("300", "Synonym");
    Map<String, String> acceptabilityMap = new HashMap<>();
    acceptabilityMap.put(PROJECT_REFSET_ID, "ACCEPTABLE");
    synonym.setAcceptabilityMap(acceptabilityMap);
    SnowstormConcept concept = createConcept(CORE_MODULE_ID, fsn, synonym);

    // Change project refset acceptability — should be allowed
    SnowstormDescription updatedSynonym = createSynonym("300", "Synonym");
    Map<String, String> updatedAcceptabilityMap = new HashMap<>();
    updatedAcceptabilityMap.put(PROJECT_REFSET_ID, "PREFERRED");
    updatedSynonym.setAcceptabilityMap(updatedAcceptabilityMap);
    ProductDescriptionUpdateRequest request =
        ProductDescriptionUpdateRequest.builder().descriptions(Set.of(fsn, updatedSynonym)).build();

    assertThatNoException()
        .isThrownBy(
            () ->
                ProductUpdateService.validateCoreConceptDescriptionsImmutable(
                    concept, request, PREFERRED_LANG_REFSETS));
  }

  @Test
  void allowsEquivalentEditsForNonProtectedDescriptionsAndNonCoreConcepts() {
    SnowstormDescription fsn = createFsn("100", "Original FSN");
    SnowstormDescription usPt = createUsPreferredSynonym("200", "Original US PT");
    SnowstormDescription synonym = createSynonym("300", "Allowed synonym");

    // Synonym term edit is allowed for core concepts
    SnowstormDescription updatedSynonym = createSynonym("300", "Updated synonym");
    ProductDescriptionUpdateRequest coreRequest =
        ProductDescriptionUpdateRequest.builder()
            .descriptions(Set.of(fsn, usPt, updatedSynonym))
            .build();

    assertThatNoException()
        .isThrownBy(
            () ->
                ProductUpdateService.validateCoreConceptDescriptionsImmutable(
                    createConcept(CORE_MODULE_ID, fsn, usPt, synonym),
                    coreRequest,
                    PREFERRED_LANG_REFSETS));

    // FSN edit is allowed for extension concepts
    SnowstormDescription updatedFsn = createFsn("100", "Updated FSN");
    ProductDescriptionUpdateRequest extensionRequest =
        ProductDescriptionUpdateRequest.builder()
            .descriptions(Set.of(updatedFsn, usPt, synonym))
            .build();

    assertThatNoException()
        .isThrownBy(
            () ->
                ProductUpdateService.validateCoreConceptDescriptionsImmutable(
                    createConcept(EXTENSION_MODULE_ID, fsn, usPt, synonym),
                    extensionRequest,
                    PREFERRED_LANG_REFSETS));
  }

  private static SnowstormConcept createConcept(
      String moduleId, SnowstormDescription... descriptions) {
    SnowstormConcept concept = new SnowstormConcept();
    concept.setModuleId(moduleId);
    concept.setDescriptions(Set.of(descriptions));
    return concept;
  }

  private static SnowstormDescription createFsn(String id, String term) {
    SnowstormDescription description = new SnowstormDescription();
    description.setDescriptionId(id);
    description.setType("FSN");
    description.setTerm(term);
    description.setActive(true);
    return description;
  }

  private static SnowstormDescription createUsPreferredSynonym(String id, String term) {
    SnowstormDescription description = createSynonym(id, term);
    Map<String, String> acceptabilityMap = new HashMap<>();
    acceptabilityMap.put(US_REFSET_ID, "PREFERRED");
    description.setAcceptabilityMap(acceptabilityMap);
    return description;
  }

  private static SnowstormDescription createSynonym(String id, String term) {
    SnowstormDescription description = new SnowstormDescription();
    description.setDescriptionId(id);
    description.setType("SYNONYM");
    description.setTerm(term);
    description.setActive(true);
    return description;
  }
}
