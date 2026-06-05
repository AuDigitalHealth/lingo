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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "snomio.field-bindings")
@Getter
@Setter
@Validated
public class FieldBindingConfiguration {

  @Value("${ihtsdo.ap.defaultBranch}")
  String apDefaultBranch;

  Map<String, Map<String, String>> mappers = new HashMap<>();

  private Map<String, String> resolveMapperForDefaultBranch() {
    String normalizedBranch = apDefaultBranch.replace("/", "_");
    return mappers.getOrDefault(normalizedBranch, mappers.entrySet().iterator().next().getValue());
  }

  @Cacheable(cacheNames = CacheConstants.VALIDATION_EXCLUDED_SUBSTANCES)
  public Set<String> getExcludedSubstances() {
    String excludedItems =
        resolveMapperForDefaultBranch().getOrDefault("product.validation.exclude.substances", "");
    return Arrays.stream(excludedItems.split(","))
        .map(String::trim)
        .filter(item -> !item.isEmpty())
        .collect(Collectors.toSet());
  }

  @Cacheable(cacheNames = CacheConstants.BRAND_SEMANTIC_TAG)
  public String getBrandSemanticTag() {
    return resolveMapperForDefaultBranch().getOrDefault("product.productName.semanticTag", "");
  }

  @Cacheable(cacheNames = CacheConstants.PREFERRED_TERM_MAX_LENGTH)
  public String getPreferredTermMaxLength() {
    return resolveMapperForDefaultBranch().getOrDefault("description.preferredTerm.maxLength", "");
  }

  @Cacheable(cacheNames = CacheConstants.DESCRIPTION_VALIDATION_REGEX)
  public String getDescriptionValidationRegex() {
    return resolveMapperForDefaultBranch().getOrDefault("description.validation.regex", "");
  }
}
