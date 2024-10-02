package com.csiro.snomio.configuration;

import java.util.List;
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

  String apSnodineDefaultBranch;

  String apLanguageHeader;

  String apApiBaseUrl;

  String fhirServerBaseUrl;

  String fhirServerExtension;

  String fhirPreferredForLanguage;

  String fhirRequestCount;

  String snodineSnowstormProxy;

  List<String> snodineExtensionModules;
}
