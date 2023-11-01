package com.csiro.snomio.service;

import com.csiro.snomio.helper.AuthHelper;
import com.csiro.snomio.models.ImsUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class LoginService {

  private final WebClient imsApiClient;
  private final AuthHelper authHelper;

  @Autowired
  public LoginService(@Qualifier("imsApiClient") WebClient imsApiClient, AuthHelper authHelper) {
    this.imsApiClient = imsApiClient;
    this.authHelper = authHelper;
  }

  @Cacheable(cacheNames = "users")
  public ImsUser getUserByToken(String cookie) throws AccessDeniedException {
    return imsApiClient
        .get()
        .uri("/api/account")
        .cookie(authHelper.getImsCookieName(), cookie)
        .retrieve()
        .bodyToMono(ImsUser.class)
        .block();
  }
}
