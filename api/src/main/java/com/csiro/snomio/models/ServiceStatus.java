package com.csiro.snomio.models;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@Builder
public class ServiceStatus {
  private Status authoringPlatform;
  private SnowstormStatus snowstorm;
  private Status cis;

  @Data
  @SuperBuilder
  public static class Status {
    private boolean running;
    private String version;
  }

  @EqualsAndHashCode(callSuper = true)
  @Data
  @SuperBuilder
  public static class SnowstormStatus extends Status {
    private String effectiveDate;
  }
}
