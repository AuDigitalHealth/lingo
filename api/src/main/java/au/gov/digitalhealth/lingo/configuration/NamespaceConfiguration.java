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
