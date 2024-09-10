package com.csiro.snomio.util;

public class CacheConstants {

  public static final String USERS_CACHE = "users";
  public static final String JIRA_USERS_CACHE = "jiraUsers";
  public static final String SNOWSTORM_STATUS_CACHE = "snowstorm-status";
  public static final String AP_STATUS_CACHE = "ap-status";
  public static final String ALL_TASKS_CACHE = "all-tasks";
  public static final String COMPOSITE_UNIT_CACHE = "composite-unit";
  public static final String UNIT_NUMERATOR_DENOMINATOR_CACHE = "unit-numerator-denominator";
  public static final String VALIDATION_EXCLUDED_SUBSTANCES = "validation-excluded-substances";

  private CacheConstants() {
    throw new IllegalStateException("Utility class");
  }
}
