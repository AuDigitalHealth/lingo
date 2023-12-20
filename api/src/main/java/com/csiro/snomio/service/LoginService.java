package com.csiro.snomio.service;

import com.csiro.snomio.auth.ImsUser;
import com.csiro.snomio.exception.AuthenticationProblem;
import com.csiro.snomio.helper.AuthHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

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
        .onStatus(
            HttpStatus.FORBIDDEN::equals,
            clientResponse ->
                Mono.error(
                    new AuthenticationProblem(
                        "Forbidden looking up user based on supplied cookie")))
        .bodyToMono(ImsUser.class)
        .block();
  }
}
