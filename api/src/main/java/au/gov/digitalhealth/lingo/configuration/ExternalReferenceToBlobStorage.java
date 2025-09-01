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

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "external-reference-to-blob-storage")
@Getter
@Setter
@Validated
public class ExternalReferenceToBlobStorage {

  private S3 s3;
  private List<WhitelistEntry> whitelistPrefixes;
  private boolean ignoreCertificateErrors = false;

  public boolean isConfigured() {
    return whitelistPrefixes != null && !whitelistPrefixes.isEmpty() || s3 != null;
  }

  @AssertTrue(message = "S3 details are required if whitelist is configured")
  public boolean isConfiguredCorrectly() {
    return whitelistPrefixes != null && !whitelistPrefixes.isEmpty() && s3 != null;
  }

  @Getter
  @Setter
  @Validated
  public static class WhitelistEntry {
    private @URL(message = "Each whitelist prefix must be a valid URL") String prefix;
    private boolean passOnAuthHeader;

    public boolean matches(String url) {
      return url.startsWith(prefix);
    }
  }

  @Getter
  @Setter
  @Validated
  public static class S3 {
    @NotBlank(message = "S3 bucket name is required")
    @Pattern(
        regexp = "^(?=.{3,63}$)(?!\\d+\\.\\d+\\.\\d+\\.\\d+$)([a-z0-9](?:[a-z0-9-\\.]*[a-z0-9])?)$",
        message =
            "Bucket name must be 3-63 chars, lowercase letters, numbers, dots or hyphens, start and end with a letter or number, and not look like an IP address")
    private String bucketName;

    @NotBlank(message = "AWS region is required")
    private String region;

    @NotBlank(message = "AWS access key is required")
    private String accessKey;

    @NotBlank(message = "AWS secret key is required")
    private String secretKey;

    private String httpBaseUrl;

    // Optional prefix inside the bucket. For sanity, forbid leading slash.
    @Pattern(regexp = "^(|[^/].*)$", message = "Prefix must not start with a slash")
    @Size(max = 1024, message = "Prefix is too long")
    private String prefix;
  }
}
