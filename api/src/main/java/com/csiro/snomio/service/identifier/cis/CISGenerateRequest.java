package com.csiro.snomio.service.identifier.cis;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public final class CISGenerateRequest {

  private final String softwareName;
  private final int namespace;
  private final String partitionId;
  private final int quantity;

  @JsonCreator
  public CISGenerateRequest(
      @JsonProperty("namespace") int namespace,
      @JsonProperty("partitionId") String partitionId,
      @JsonProperty("quantity") int quantity,
      @JsonProperty("software") String software) {

    this.namespace = namespace;
    this.partitionId = partitionId;
    this.quantity = quantity;
    this.softwareName = software;
  }
}
