package com.poc.mat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.poc.mat.models.ImsUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AuthoringServicesRestClient {

  private final String authoringServicesRestClient;
  private final String imsCookieName;

  private final String imsCookieValue;
  private final RestTemplate restTemplate;

  @Autowired
  public AuthoringServicesRestClient(
      @Value("${ap.api.url}") String authoringServicesRestClient,
      @Value("${ims.api.cookie.name}") String imsCookieName,
      @Value("${ims.api.cookie.value}") String imsCookieValue
  ) {
    this.authoringServicesRestClient = authoringServicesRestClient;
    this.imsCookieName = imsCookieName;
    this.imsCookieValue = imsCookieValue;
    restTemplate = new RestTemplateBuilder()
        .rootUri(authoringServicesRestClient)
        .build();
  }

  public JsonArray getUserTasks(String cookieValue)
      throws AccessDeniedException {
    final String cookieValueOverride = imsCookieValue.isEmpty() ? cookieValue : imsCookieValue;

    final HttpHeaders httpHeaders = new HttpHeaders();
    httpHeaders.add("Cookie", imsCookieName + "=" + cookieValueOverride + ";");

    final HttpEntity<Void> requestEntity = new HttpEntity<>(httpHeaders);
    final String result = String.valueOf(
        restTemplate.exchange("/projects/my-tasks?excludePromoted=false", HttpMethod.GET,
            requestEntity, String.class).getBody());

    JsonArray convertedObject = new Gson().fromJson(result, JsonArray.class);

    return convertedObject;
  }
}
