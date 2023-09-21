package com.csiro.snomio.security;

public class BranchPathUriUtil {

  public static final String SLASH = "/";
  public static final String ENCODED_PIPE = "%7C";
  public static final String ENCODED_SLASH = "%2F";

  private BranchPathUriUtil() {
    /* Prevent instantiation */
  }

  public static String encodePath(String path) {
    return path.replace(ENCODED_SLASH, ENCODED_PIPE).replace(SLASH, ENCODED_PIPE);
  }

  public static String decodePath(String branch) {
    return branch.replace("|", SLASH).replace(ENCODED_PIPE, SLASH);
  }
}
