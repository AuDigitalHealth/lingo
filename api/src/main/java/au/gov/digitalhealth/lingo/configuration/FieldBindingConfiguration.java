/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.configuration;

import au.gov.digitalhealth.lingo.util.CacheConstants;
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
  private static final String DEFAULT_BRANCH_KEY = "MAIN_SNOMEDCT-AU_AUAMT";
  Map<String, Map<String, String>> mappers = new HashMap<>();

  @Cacheable(cacheNames = CacheConstants.VALIDATION_EXCLUDED_SUBSTANCES)
  public Set<String> getExcludedSubstances() {
    // will use default branch for now
    Map<String, String> resultMap =
        mappers.getOrDefault(DEFAULT_BRANCH_KEY, mappers.entrySet().iterator().next().getValue());
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
        mappers.getOrDefault(DEFAULT_BRANCH_KEY, mappers.entrySet().iterator().next().getValue());
    return resultMap.getOrDefault("product.productName.semanticTag", "");
  }
}
