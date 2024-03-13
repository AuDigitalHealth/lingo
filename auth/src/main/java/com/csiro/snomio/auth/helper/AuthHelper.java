package com.csiro.snomio.auth.helper;


import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.auth.service.ImsService;
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



  private ImsService imsService;

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
  public final ExchangeFilterFunction addImsAuthCookie =
          (clientRequest, nextFilter) -> {
            ClientRequest filteredRequest =
                    ClientRequest.from(clientRequest)
                            .cookie(getImsCookieName(),getCookieValue())
                            .build();
            return nextFilter.exchange(filteredRequest);
          };

  public final ExchangeFilterFunction addDefaultAuthCookie =
          (clientRequest, nextFilter) -> {
            ClientRequest filteredRequest =
                    ClientRequest.from(clientRequest)
                            .cookie(getImsCookieName(), imsService.getDefaultCookie().getValue())
                            .build();
            return nextFilter.exchange(filteredRequest);
          };
}
