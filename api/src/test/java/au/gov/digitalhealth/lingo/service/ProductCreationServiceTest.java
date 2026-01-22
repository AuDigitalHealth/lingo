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

import static au.gov.digitalhealth.lingo.util.SnomedConstants.ADDITIONAL_RELATIONSHIP;
import static org.assertj.core.api.Assertions.assertThat;

import au.csiro.snowstorm_client.model.SnowstormRelationship;
import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** Unit tests for ProductCreationService focusing on relationship reactivation logic. */
class ProductCreationServiceTest {

  /**
   * Helper method to invoke the private updateConceptNonDefiningRelationships method using
   * reflection.
   */
  private boolean invokeUpdateConceptNonDefiningRelationships(
      Set<SnowstormRelationship> existingRelationships,
      Set<SnowstormRelationship> newRelationships)
      throws Exception {
    Method method =
        ProductCreationService.class.getDeclaredMethod(
            "updateConceptNonDefiningRelationships", Set.class, Set.class);
    method.setAccessible(true);
    return (boolean) method.invoke(null, existingRelationships, newRelationships);
  }

  /**
   * Test that an inactive ADDITIONAL_RELATIONSHIP is correctly reactivated when a matching new
   * relationship is provided.
   */
  @Test
  void testReactivateInactiveAdditionalRelationship() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId("123456");
    inactiveRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId("123456");
    newRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the relationship was reactivated
    assertThat(result).isTrue();
    assertThat(inactiveRelationship.getActive()).isTrue();
    assertThat(existingRelationships).hasSize(1);
  }

  /** Test that no duplicate relationships are created when reactivating. */
  @Test
  void testNoDuplicateRelationshipsWhenReactivating() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId("123456");
    inactiveRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId("123456");
    newRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that no duplicate was created - still only one relationship
    assertThat(existingRelationships).hasSize(1);
    assertThat(existingRelationships.iterator().next().getActive()).isTrue();
  }

  /** Test that the method returns true when relationships are reactivated. */
  @Test
  void testMethodReturnsTrueWhenRelationshipsReactivated() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId("123456");
    inactiveRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId("123456");
    newRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the method returns true when a relationship is reactivated
    assertThat(result).isTrue();
  }

  /**
   * Test that the method returns true when an active ADDITIONAL_RELATIONSHIP is removed because it
   * is not in the new relationships.
   */
  @Test
  void testMethodReturnsTrueWhenActiveRelationshipRemoved() throws Exception {
    // Create an active ADDITIONAL_RELATIONSHIP
    SnowstormRelationship activeRelationship = new SnowstormRelationship();
    activeRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    activeRelationship.setActive(true);
    activeRelationship.setTypeId("123456");
    activeRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(activeRelationship);

    // No new relationships to add
    Set<SnowstormRelationship> newRelationships = new HashSet<>();

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the method returns true because the active relationship is removed
    assertThat(result).isTrue();
    assertThat(existingRelationships).isEmpty();
  }

  /** Test reactivation with concrete value instead of destination ID. */
  @Test
  void testReactivateInactiveRelationshipWithConcreteValue() throws Exception {
    // Create an inactive ADDITIONAL_RELATIONSHIP with concrete value
    SnowstormRelationship inactiveRelationship = new SnowstormRelationship();
    inactiveRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    inactiveRelationship.setActive(false);
    inactiveRelationship.setTypeId("123456");
    inactiveRelationship.setConcreteValue("100");

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveRelationship);

    // Create a new relationship that matches the inactive one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId("123456");
    newRelationship.setConcreteValue("100");

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the relationship was reactivated
    assertThat(result).isTrue();
    assertThat(inactiveRelationship.getActive()).isTrue();
    assertThat(existingRelationships).hasSize(1);
  }

  /**
   * Test that a new relationship is added when no matching inactive or active relationship exists.
   */
  @Test
  void testAddNewRelationshipWhenNoMatchExists() throws Exception {
    Set<SnowstormRelationship> existingRelationships = new HashSet<>();

    // Create a new relationship
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId("123456");
    newRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the new relationship was added
    assertThat(result).isTrue();
    assertThat(existingRelationships).hasSize(1);
    assertThat(existingRelationships.iterator().next()).isEqualTo(newRelationship);
  }

  /**
   * Test that active ADDITIONAL_RELATIONSHIP relationships are removed if not in new
   * relationships.
   */
  @Test
  void testRemoveActiveRelationshipNotInNewRelationships() throws Exception {
    // Create an active ADDITIONAL_RELATIONSHIP
    SnowstormRelationship activeRelationship = new SnowstormRelationship();
    activeRelationship.setCharacteristicType(ADDITIONAL_RELATIONSHIP.getValue());
    activeRelationship.setActive(true);
    activeRelationship.setTypeId("123456");
    activeRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(activeRelationship);

    // Create new relationships that don't match the active one
    SnowstormRelationship newRelationship = new SnowstormRelationship();
    newRelationship.setTypeId("999999");
    newRelationship.setDestinationId("888888");

    Set<SnowstormRelationship> newRelationships = new HashSet<>();
    newRelationships.add(newRelationship);

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the active relationship was removed and the new one was added
    assertThat(result).isTrue();
    assertThat(existingRelationships).hasSize(1);
    assertThat(existingRelationships.iterator().next().getTypeId()).isEqualTo("999999");
  }

  /** Test that the method returns false when no relationships need to be modified. */
  @Test
  void testMethodReturnsFalseWhenNoModificationsNeeded() throws Exception {
    // Create an inactive relationship (not ADDITIONAL_RELATIONSHIP characteristic type)
    SnowstormRelationship inactiveOtherRelationship = new SnowstormRelationship();
    inactiveOtherRelationship.setCharacteristicType("SOME_OTHER_TYPE");
    inactiveOtherRelationship.setActive(false);
    inactiveOtherRelationship.setTypeId("123456");
    inactiveOtherRelationship.setDestinationId("789012");

    Set<SnowstormRelationship> existingRelationships = new HashSet<>();
    existingRelationships.add(inactiveOtherRelationship);

    // Empty new relationships set
    Set<SnowstormRelationship> newRelationships = new HashSet<>();

    // Invoke the private method using reflection
    boolean result =
        invokeUpdateConceptNonDefiningRelationships(existingRelationships, newRelationships);

    // Verify that the method returns false because no modifications were made
    // (the inactive relationship is not an ADDITIONAL_RELATIONSHIP so it's not removed)
    assertThat(result).isFalse();
    assertThat(existingRelationships).hasSize(1);
  }
}
