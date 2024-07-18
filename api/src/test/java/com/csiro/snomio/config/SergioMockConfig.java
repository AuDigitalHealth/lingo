package com.csiro.snomio.config;

import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

public class SergioMockConfig {

  private static final String SINGULAR_ARTGID_ENTRY_URL = "/api/artgid/%s";

  public static WireMockServer wireMockServer() {
    WireMockServer wireMockServer =
        new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
    wireMockServer.start();

    return wireMockServer;
  }

  public static void stubSergioResponse(Long artgid, String responseBody) {
    stubFor(
        WireMock.get(WireMock.urlPathEqualTo(String.format(SINGULAR_ARTGID_ENTRY_URL, artgid)))
            .willReturn(
                WireMock.aResponse()
                    .withHeader("Content-Type", "application/json")
                    .withStatus(200)
                    .withBody(responseBody)));
  }
}
