package com.csiro.snomio.configuration;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserInterfaceConfiguration {

  String appName = "snomio";

  String imsUrl;

  String apUrl;

  String apProjectKey;

  String apDefaultBranch;
}
