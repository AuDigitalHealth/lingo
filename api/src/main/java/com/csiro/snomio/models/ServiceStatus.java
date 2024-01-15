package com.csiro.snomio.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ServiceStatus {
  private Status authoringPlatform;
  private Status snowstorm;

  @Data
  @Builder
  public static class Status {
    private boolean running;
    private String version;
  }
}
