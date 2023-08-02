package com.csiro.snomio.service;

import com.csiro.snomio.security.auth.AuthHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.csiro.snomio.models.ImsUser;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class LoginService {
  private final String imsCookieName;
  private final WebClient webClient;

  @Autowired
  public LoginService(@Qualifier("imsWebClient") WebClient webClient,
      @Value("${ims.api.cookie.name}") String imsCookieName
  ) {
    this.webClient = webClient;
    this.imsCookieName = imsCookieName;

  }

  @Cacheable(cacheNames="users")
  public ImsUser getUserByToken(String cookie)
      throws AccessDeniedException {
    ImsUser user =  webClient.get().uri("/api/account").cookie(imsCookieName, cookie).retrieve().bodyToMono(ImsUser.class).block();
    return user;
  }

}
