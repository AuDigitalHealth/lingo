package com.csiro.snomio.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.TelemetryProblem;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

class TelemetryControllerTest {

  private static final String X_B3_FLAGS_HEADER = "X-B3-Flags";
  private static final String X_B3_SAMPLED_HEADER = "X-B3-Sampled";
  private static final String X_B3_PARENT_SPAN_ID_HEADER = "X-B3-ParentSpanId";
  private static final String X_B3_SPAN_ID_HEADER = "X-B3-SpanId";
  private static final String TRACEPARENT_HEADER = "traceparent";
  private static final String X_B3_TRACE_ID_HEADER = "X-B3-TraceId";
  private MockWebServer mockWebServer;
  private TelemetryController telemetryController;
  private static final String OTLP_ENDPOINT = "/otlp";
  private static final String ZIPKIN_ENDPOINT = "/zipkin";

  @Mock private Authentication authentication;

  @BeforeEach
  void setup() throws Exception {
    MockitoAnnotations.openMocks(this);
    SecurityContext securityContext = mock(SecurityContext.class);
    Map<String, Object> user = new HashMap<String, Object>();
    user.put("login", "test");
    user.put("firstName", "test");
    user.put("email", "test@test.com");
    user.put("langKey", "en");
    List<String> roles = Arrays.asList("ms-australia");
    user.put("roles", roles);
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(securityContext.getAuthentication().getPrincipal()).thenReturn(new ImsUser(user));
    SecurityContextHolder.setContext(securityContext);

    mockWebServer = new MockWebServer();
    mockWebServer.start();
    String baseUrl = mockWebServer.url("/").toString();
    WebClient otCollectorZipkinClient =
        WebClient.builder()
            .baseUrl(baseUrl + "zipkin") // Append specific endpoint path here
            .build();
    WebClient otCollectorOTLPClient =
        WebClient.builder()
            .baseUrl(baseUrl + "otlp") // Append specific endpoint path here
            .build();

    telemetryController = new TelemetryController(otCollectorZipkinClient, otCollectorOTLPClient);
    telemetryController.setTelemetryEnabled(true);
    telemetryController.setOtelExporterEndpoint(mockWebServer.url(OTLP_ENDPOINT).toString());
    telemetryController.setZipkinExporterEndpoint(mockWebServer.url(ZIPKIN_ENDPOINT).toString());
  }

  @AfterEach
  void tearDown() throws Exception {
    mockWebServer.shutdown();
  }

  @Test
  void testTelemetryDisabled() {
    telemetryController.setTelemetryEnabled(false);
    var result = telemetryController.forwardTelemetry(new byte[] {}, null).block();
    assertNull(result);
  }

  @Test
  void testTelemetryForwardingToOTLP() throws Exception {
    mockWebServer.enqueue(new MockResponse().setResponseCode(200));
    telemetryController
        .forwardTelemetry("{\"resourceSpans\":[]}".getBytes(), createMockOtlpRequest())
        .block();
    RecordedRequest request = mockWebServer.takeRequest(1, TimeUnit.SECONDS);
    assertNotNull(request);
    assertEquals(OTLP_ENDPOINT, request.getPath());
    assertEquals(
        "00-abcdef1234567890abcdef1234567890-abcdef1234567890-01",
        request.getHeader(TRACEPARENT_HEADER));
    assertNull(request.getHeader(X_B3_TRACE_ID_HEADER));
    assertNull(request.getHeader(X_B3_SPAN_ID_HEADER));
    assertNull(request.getHeader(X_B3_PARENT_SPAN_ID_HEADER));
    assertNull(request.getHeader(X_B3_SAMPLED_HEADER));
    assertNull(request.getHeader(X_B3_FLAGS_HEADER));
  }

  @Test
  void testTelemetryForwardingToZipkin() throws Exception {
    mockWebServer.enqueue(new MockResponse().setResponseCode(200));
    telemetryController.forwardTelemetry("[]".getBytes(), createMockZipkinRequest()).block();
    RecordedRequest request = mockWebServer.takeRequest(1, TimeUnit.SECONDS);
    assertNotNull(request);
    assertNull(request.getHeader(TRACEPARENT_HEADER));
    assertEquals(ZIPKIN_ENDPOINT, request.getPath());
    assertEquals("12345", request.getHeader(X_B3_TRACE_ID_HEADER));
    assertEquals("abcde", request.getHeader(X_B3_SPAN_ID_HEADER));
    assertEquals("fghij", request.getHeader(X_B3_PARENT_SPAN_ID_HEADER));
    assertEquals("1", request.getHeader(X_B3_SAMPLED_HEADER));
    assertEquals("1", request.getHeader(X_B3_FLAGS_HEADER));
  }

  @Test
  void testInvalidTelemetryDataHandling() {
    mockWebServer.enqueue(new MockResponse().setResponseCode(400));
    Mono<Void> result =
        telemetryController.forwardTelemetry(
            "{malformed json".getBytes(), new MockHttpServletRequest());
    assertThrows(TelemetryProblem.class, () -> result.block());
  }

  private MockHttpServletRequest createMockOtlpRequest() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader(
        TRACEPARENT_HEADER, "00-abcdef1234567890abcdef1234567890-abcdef1234567890-01");
    return request;
  }

  private MockHttpServletRequest createMockZipkinRequest() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader(X_B3_TRACE_ID_HEADER, "12345");
    request.addHeader(X_B3_SPAN_ID_HEADER, "abcde");
    request.addHeader(X_B3_PARENT_SPAN_ID_HEADER, "fghij");
    request.addHeader(X_B3_SAMPLED_HEADER, "1");
    request.addHeader(X_B3_FLAGS_HEADER, "1");
    return request;
  }
}
