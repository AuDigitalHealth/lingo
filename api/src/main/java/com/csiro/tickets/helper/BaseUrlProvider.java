package com.csiro.tickets.helper;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BaseUrlProvider {

  @Autowired private HttpServletRequest request;

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
