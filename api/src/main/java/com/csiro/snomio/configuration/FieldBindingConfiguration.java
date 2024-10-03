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
  private static final String defaultBranchKey = "MAIN_SNOMEDCT-AU_AUAMT";

  @Cacheable(cacheNames = CacheConstants.VALIDATION_EXCLUDED_SUBSTANCES)
  public Set<String> getExcludedSubstances() {
    // will use default branch for now
    Map<String, String> resultMap =
        mappers.getOrDefault(defaultBranchKey, mappers.entrySet().iterator().next().getValue());
    String excludedItems = resultMap.getOrDefault("product.validation.exclude.substances", "");
    return Arrays.stream(excludedItems.split(","))
        .map(String::trim)
        .filter(item -> !item.isEmpty())
        .collect(Collectors.toSet());
  }

  @Cacheable(cacheNames = CacheConstants.BRAND_SEMANTIC_TAG)
  public String getBrandSemanticTag() {
    // will use default branch for now
    Map<String, String> resultMap =
        mappers.getOrDefault(defaultBranchKey, mappers.entrySet().iterator().next().getValue());
    return resultMap.getOrDefault("product.productName.semanticTag", "");
  }
}
