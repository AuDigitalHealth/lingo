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
package au.gov.digitalhealth.lingo.util;

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
