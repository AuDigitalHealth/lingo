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
package au.gov.digitalhealth.lingo.configuration.model;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.util.YamlPropertySourceFactory;
import jakarta.validation.ValidationException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Component;

/**
 * Configuration of the models available in the system. Key is the project branch name in Snowstorm
 * and the value is a {@link ModelConfiguration}.
 */
@Component
@ConfigurationProperties(prefix = "models")
// @PropertySource(value = "{model.config}", ignoreResourceNotFound = true)
@PropertySource(
    value = "classpath:default-model-config.yaml",
    factory = YamlPropertySourceFactory.class)
public class Models extends HashMap<String, ModelConfiguration> implements InitializingBean {
  @Override
  public void afterPropertiesSet() throws ValidationException, IOException {
    if (this.isEmpty()) {
      throw new ValidationException("The models map must not be empty");
    }
    if (this.containsKey("MAIN")) {
      throw new ValidationException(
          "The MAIN project is reserved and cannot be used as a model configuration key");
    }
  }

  public ModelConfiguration getModelConfiguration(String branch) {
    Set<String> matchingKeys =
        keySet().stream().filter(branch.replace("|", "_")::startsWith).collect(Collectors.toSet());

    if (matchingKeys.isEmpty()) {
      throw new ResourceNotFoundProblem("No models found for branch " + branch);
    } else if (matchingKeys.size() > 1) {
      throw new LingoProblem(
          "Multiple models found for branch " + branch + " keys were " + matchingKeys);
    }

    return get(matchingKeys.iterator().next());
  }
}
