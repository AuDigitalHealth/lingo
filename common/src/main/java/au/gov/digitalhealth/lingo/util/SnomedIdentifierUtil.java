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

import org.apache.commons.validator.routines.checkdigit.VerhoeffCheckDigit;

public class SnomedIdentifierUtil {
  private static final VerhoeffCheckDigit verhoeffCheck = new VerhoeffCheckDigit();

  private SnomedIdentifierUtil() {}

  public static boolean isValid(String sctId, PartitionIdentifier partitionIdentifier) {
    int partitionNumber = Integer.parseInt("" + sctId.charAt(sctId.length() - 2));
    if (partitionNumber != partitionIdentifier.ordinal()) {
      return false;
    }
    return verhoeffCheck.isValid(sctId);
  }
}
