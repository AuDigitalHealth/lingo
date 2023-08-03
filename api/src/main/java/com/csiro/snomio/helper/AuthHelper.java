package com.csiro.snomio.helper;

import com.csiro.snomio.models.ImsUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

@Component
public class AuthHelper {

  @Value("${ims.api.cookie.name}")
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
}
