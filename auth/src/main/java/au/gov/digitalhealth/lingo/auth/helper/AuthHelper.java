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
package au.gov.digitalhealth.lingo.auth.helper;

import au.gov.digitalhealth.lingo.auth.model.ImsUser;
import au.gov.digitalhealth.lingo.auth.service.ImsService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.util.WebUtils;

@Component
public class AuthHelper {

  @Value("${ihtsdo.ims.api.cookie.name}")
  @Getter
  private String imsCookieName;

  public final ExchangeFilterFunction addImsAuthCookie =
      (clientRequest, nextFilter) -> {
        ClientRequest filteredRequest =
            ClientRequest.from(clientRequest).cookie(getImsCookieName(), getCookieValue()).build();
        return nextFilter.exchange(filteredRequest);
      };
  private ImsService imsService;
  public final ExchangeFilterFunction addDefaultAuthCookie =
      (clientRequest, nextFilter) -> {
        ClientRequest filteredRequest =
            ClientRequest.from(clientRequest)
                .cookie(getImsCookieName(), imsService.getDefaultCookie().getValue())
                .build();
        return nextFilter.exchange(filteredRequest);
      };

  @Autowired
  public AuthHelper(ImsService imsService) {
    this.imsService = imsService;
  }

  public Authentication getAuthentication() {
    return SecurityContextHolder.getContext().getAuthentication();
  }

  public ImsUser getImsUser() {
    return (ImsUser) getAuthentication().getPrincipal();
  }

  public String getCookieValue() {
    return (String) getAuthentication().getCredentials();
  }

  public Cookie getImsCookie(HttpServletRequest request) {
    return WebUtils.getCookie(request, imsCookieName);
  }

  public void cancelImsCookie(HttpServletRequest request, HttpServletResponse response) {
    Cookie imsCookie = WebUtils.getCookie(request, imsCookieName);

    if (imsCookie != null) {
      imsCookie.setMaxAge(0);
      imsCookie.setDomain("ihtsdotools.org");
      imsCookie.setPath("/");
      imsCookie.setSecure(true);
      response.addCookie(imsCookie);
    }
  }
}
