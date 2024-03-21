package com.csiro.snomio.util;

public class CacheConstants {

  private CacheConstants() {
    throw new IllegalStateException("Utility class");
  }

  public static final String USERS_CACHE = "users";

  public static final String JIRA_USERS_CACHE = "jiraUsers";
  public static final String SNOWSTORM_STATUS_CACHE = "snowstorm-status";
  public static final String AP_STATUS_CACHE = "ap-status";
  public static final String ALL_TASKS_CACHE = "all-tasks";
}
