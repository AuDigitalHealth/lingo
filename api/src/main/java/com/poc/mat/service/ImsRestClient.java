package com.poc.mat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.poc.mat.models.ImsUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class ImsRestClient {

  private String imsApiUrl;

  private final String imsCookieName;

  private final String imsCookieValue;

  private final RestTemplate restTemplate;

  @Autowired
  public ImsRestClient(
      @Value("${ims.api.url}") String imsApiUrl,
      @Value("${ims.api.cookie.name}") String imsCookieName,
      @Value("${ims.api.cookie.value}") String imsCookieValue
  ) {
    this.imsApiUrl = imsApiUrl;
    this.imsCookieName = imsCookieName;
    this.imsCookieValue = imsCookieValue;
    restTemplate = new RestTemplateBuilder()
        .rootUri(imsApiUrl)
        .build();
  }

  @Cacheable(cacheNames="users")
  public ImsUser getUserByToken(String cookieValue)
      throws JsonProcessingException, AccessDeniedException {

    final String cookieValueOverride = imsCookieValue.isEmpty() ? cookieValue : imsCookieValue;

    final HttpHeaders httpHeaders = new HttpHeaders();
    httpHeaders.add("Cookie", imsCookieName + "=" + cookieValueOverride + ";");

    final HttpEntity<Void> requestEntity = new HttpEntity<>(httpHeaders);
    final String result = String.valueOf(
        restTemplate.exchange("/api/account", HttpMethod.GET, requestEntity, String.class)
            .getBody());

    final ObjectMapper objectMapper = new ObjectMapper();
    Map<String, Object> jsonObject = objectMapper.readValue(result, Map.class);

    final ImsUser user = new ImsUser(jsonObject);

    return user;
  }

}
