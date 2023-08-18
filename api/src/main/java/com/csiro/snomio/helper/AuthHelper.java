package com.csiro.snomio.helper;

import com.csiro.snomio.models.ImsUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

@Component
public class AuthHelper {

  @Value("${ihtsdo.ims.api.cookie.name}")
  @Getter
  private String imsCookieName;

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
