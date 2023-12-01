package com.csiro.snomio.configuration;

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
