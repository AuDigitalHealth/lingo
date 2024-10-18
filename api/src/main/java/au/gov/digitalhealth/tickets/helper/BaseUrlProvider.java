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
package au.gov.digitalhealth.tickets.helper;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BaseUrlProvider {

  private final HttpServletRequest request;

  @Autowired
  public BaseUrlProvider(HttpServletRequest request) {
    this.request = request;
  }

  public String getBaseUrl() {
    String scheme = request.getScheme(); // http or https
    String serverName = request.getServerName(); // localhost or your domain
    int serverPort = request.getServerPort(); // 8080 or your port

    // Construct the base URL
    StringBuilder baseUrl = new StringBuilder();
    baseUrl.append(scheme).append("://").append(serverName);

    // Include the port in the base URL if it's not the default HTTP (80) or HTTPS (443) port
    if ((scheme.equals("http") && serverPort != 80)
        || (scheme.equals("https") && serverPort != 443)) {
      baseUrl.append(":").append(serverPort);
    }

    return baseUrl.toString();
  }
}
