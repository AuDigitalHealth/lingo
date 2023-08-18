package com.csiro.snomio.models;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserInterfaceConfiguration {

  String appName = "snomio";

  String imsUrl;

  String apUrl;
}
