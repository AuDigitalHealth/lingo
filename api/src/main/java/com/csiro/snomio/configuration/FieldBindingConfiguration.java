package com.csiro.snomio.configuration;

import com.csiro.snomio.util.CacheConstants;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "snomio.field-bindings")
@Getter
@Setter
@Validated
public class FieldBindingConfiguration {
  Map<String, Map<String, String>> mappers = new HashMap<>();

  @Cacheable(cacheNames = CacheConstants.VALIDATION_EXCLUDED_SUBSTANCES)
  public Set<String> getExcludedSubstances() {
    String branchKey = "MAIN_SNOMEDCT-AU_AUAMT"; // will use default branch for now as
    Map<String, String> resultMap =
        mappers.getOrDefault(branchKey, mappers.entrySet().iterator().next().getValue());
    String excludedItems = resultMap.getOrDefault("product.validation.exclude.substances", "");
    return Arrays.stream(excludedItems.split(","))
        .map(String::trim)
        .filter(item -> !item.isEmpty())
        .collect(Collectors.toSet());
  }
}
