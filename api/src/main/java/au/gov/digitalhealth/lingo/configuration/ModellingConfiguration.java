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

import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "snomio.modelling")
@Getter
@Setter
@Validated
public class ModellingConfiguration {
  Set<Long> ungroupedRelationshipTypes =
      Set.of(
          116680003L,
          784276002L,
          774159003L,
          766953001L,
          738774007L,
          736473005L,
          766939001L,
          733930001L,
          272741003L,
          736475003L,
          774081006L,
          736518005L,
          411116001L,
          766952006L,
          726542003L,
          766954007L,
          733932009L,
          774158006L,
          736474004L,
          736472000L,
          30394011000036104L,
          30465011000036106L,
          30523011000036108L,
          700000061000036106L,
          700000071000036103L,
          700000091000036104L,
          700000101000036108L,
          733933004L,
          763032000L,
          733928003L,
          733931002L,
          736476002L);
}
