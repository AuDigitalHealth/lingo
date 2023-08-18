package com.csiro.snomio.models;

import com.csiro.snomio.configuration.IhtsdoConfiguration;
import lombok.Builder;
import lombok.Value;
import org.springframework.beans.factory.annotation.Autowired;

@Value
@Builder
public class UserInterfaceConfiguration {

  String appName = "snomio";

  String imsUrl;

  String apUrl;
}
