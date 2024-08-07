package com.csiro.snomio.configuration;

import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "snomio.namespace")
@Getter
@Validated
public class NamespaceConfiguration {
  Map<String, Integer> map = new HashMap<>();

  public static String getConceptPartitionId(int namespace) {
    String partitionId;
    if (namespace == 0) {
      partitionId = "00";
    } else {
      partitionId = "10";
    }
    return partitionId;
  }

  public Integer getNamespace(String key) {
    return map.get(key);
  }
}
