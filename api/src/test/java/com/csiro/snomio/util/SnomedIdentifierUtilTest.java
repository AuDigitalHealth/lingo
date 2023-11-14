package com.csiro.snomio.util;

import org.junit.Assert;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SnomedIdentifierUtilTest {

  @ParameterizedTest
  @CsvSource({
    "62090011000036109, CONCEPT, true, Valid concept id",
    "1218366016, DESCRIPTION, true, Valid description id",
    "993415201000168128, RELATIONSHIP, true, Valid relationship id",
    "1218366016, CONCEPT, false, Invalid concept id partition",
    "993415201000168128, DESCRIPTION, false, Invalid description id partition",
    "62090011000036109, RELATIONSHIP, false, Invalid relationship id partition",
    "62090011000036101, CONCEPT, false, Invalid concept id check digit",
    "1218366011, DESCRIPTION, false, Invalid description id check digit",
    "993415201000168121, RELATIONSHIP, false, Invalid relationship id check digit"
  })
  void testIsValid(String id, String partition, boolean expected, String message) {
    PartionIdentifier partitionIdentifier = PartionIdentifier.valueOf(partition);
    Assert.assertEquals(message, expected, SnomedIdentifierUtil.isValid(id, partitionIdentifier));
  }
}
