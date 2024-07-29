package com.csiro.snomio.util;

import org.apache.commons.validator.routines.checkdigit.VerhoeffCheckDigit;

public class SnomedIdentifierUtil {
  private static final VerhoeffCheckDigit verhoeffCheck = new VerhoeffCheckDigit();

  private SnomedIdentifierUtil() {}

  public static boolean isValid(String sctId, PartionIdentifier partitionIdentifier) {
    int partitionNumber = Integer.parseInt("" + sctId.charAt(sctId.length() - 2));
    if (partitionNumber != partitionIdentifier.ordinal()) {
      return false;
    }
    return verhoeffCheck.isValid(sctId);
  }
}
