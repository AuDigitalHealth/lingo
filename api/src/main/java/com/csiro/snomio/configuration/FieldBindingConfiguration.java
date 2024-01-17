package com.csiro.snomio.configuration;

import java.util.HashMap;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "snomio.field-bindings")
@Getter
@Setter
@Validated
public class FieldBindingConfiguration {
  Map<String, Map<String, String>> mappers = new HashMap<>();
}
