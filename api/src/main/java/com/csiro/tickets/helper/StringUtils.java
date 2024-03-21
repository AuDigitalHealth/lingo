package com.csiro.tickets.helper;

public class StringUtils {

  private StringUtils() {
    throw new IllegalStateException("Utility class");
  }

  public static String removePageAndAfter(String input) {
    int pageIndex = input.indexOf("&page");
    if (pageIndex != -1) {
      return input.substring(0, pageIndex);
    } else {
      return input;
    }
  }
}
