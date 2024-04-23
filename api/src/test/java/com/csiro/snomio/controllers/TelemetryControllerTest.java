package com.csiro.snomio.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.exception.TelemetryProblem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

class TelemetryControllerTest {

  private static final String SNOMIO_TEST_ENVIRONMENT = "snomio-test-environment";
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
  private static final String USER_BASE64 = "dGVzdA==";

  @Value("${snomio.environment}")
  private String snomioEnvironment;

  private final String OTEL_TELEMETRY_EXAMPLE =
      "{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"snomio-ui\"}},{\"key\":\"telemetry.sdk.language\",\"value\":{\"stringValue\":\"webjs\"}},{\"key\":\"telemetry.sdk.name\",\"value\":{\"stringValue\":\"opentelemetry\"}},{\"key\":\"telemetry.sdk.version\",\"value\":{\"stringValue\":\"1.23.0\"}}],\"droppedAttributesCount\":0},\"scopeSpans\":[{\"scope\":{\"name\":\"@opentelemetry/instrumentation-xml-http-request\",\"version\":\"0.50.0\"},\"spans\":[{\"traceId\":\"36a11cb339b5957b7666916062140b87\",\"spanId\":\"87df0287278f2b83\",\"name\":\"GET\",\"kind\":3,\"startTimeUnixNano\":\"1713702779032000000\",\"endTimeUnixNano\":\"1713702779033000000\",\"attributes\":[{\"key\":\"http.method\",\"value\":{\"stringValue\":\"GET\"}},{\"key\":\"http.url\",\"value\":{\"stringValue\":\"https://uat-snomio.ihtsdotools.org/authoring-services/authoring-services-websocket/info?t=1713702779020\"}},{\"key\":\"http.status_code\",\"value\":{\"intValue\":0}},{\"key\":\"http.status_text\",\"value\":{\"stringValue\":\"\"}},{\"key\":\"http.host\",\"value\":{\"stringValue\":\"uat-snomio.ihtsdotools.org\"}},{\"key\":\"http.scheme\",\"value\":{\"stringValue\":\"https\"}},{\"key\":\"http.user_agent\",\"value\":{\"stringValue\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36\"}}],\"droppedAttributesCount\":0,\"events\":[{\"attributes\":[],\"name\":\"open\",\"timeUnixNano\":\"1713702779032000000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"send\",\"timeUnixNano\":\"1713702779032000000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"abort\",\"timeUnixNano\":\"1713702779033000000\",\"droppedAttributesCount\":0}],\"droppedEventsCount\":0,\"status\":{\"code\":0},\"links\":[],\"droppedLinksCount\":0},{\"traceId\":\"164fe794fd608e5e3daa0cbdd6f68278\",\"spanId\":\"1d9cc86c16482ddf\",\"name\":\"GET\",\"kind\":3,\"startTimeUnixNano\":\"1713702839031000000\",\"endTimeUnixNano\":\"1713702839049000000\",\"attributes\":[{\"key\":\"http.method\",\"value\":{\"stringValue\":\"GET\"}},{\"key\":\"http.url\",\"value\":{\"stringValue\":\"https://uat-snomio.ihtsdotools.org/authoring-services/authoring-services-websocket/info?t=1713702839023\"}},{\"key\":\"http.status_code\",\"value\":{\"intValue\":0}},{\"key\":\"http.status_text\",\"value\":{\"stringValue\":\"\"}},{\"key\":\"http.host\",\"value\":{\"stringValue\":\"uat-snomio.ihtsdotools.org\"}},{\"key\":\"http.scheme\",\"value\":{\"stringValue\":\"https\"}},{\"key\":\"http.user_agent\",\"value\":{\"stringValue\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36\"}}],\"droppedAttributesCount\":0,\"events\":[{\"attributes\":[],\"name\":\"open\",\"timeUnixNano\":\"1713702839031000000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"send\",\"timeUnixNano\":\"1713702839031100000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"abort\",\"timeUnixNano\":\"1713702839049000000\",\"droppedAttributesCount\":0}],\"droppedEventsCount\":0,\"status\":{\"code\":0},\"links\":[],\"droppedLinksCount\":0}]}]}]}";
  private final String ZIPKIN_TELEMETRY_EXAMPLE =
      "[{\"traceId\":\"ed2ffe2033f25e7754ec22080f97a8bb\",\"name\":\"axios_http_request_get\",\"id\":\"a42800bcceaa2f32\",\"timestamp\":1713860461394000,\"duration\":548200,\"localEndpoint\":{\"serviceName\":\"snomio-ui\"},\"tags\":{\"url\":\"/api/status\",\"http.method\":\"get\",\"kind\":\"client\",\"http.header.Accept\":\"application/json, text/plain, */*\",\"http.header.Content-Type\":\"undefined\",\"service.name\":\"snomio-ui\",\"telemetry.sdk.language\":\"webjs\",\"telemetry.sdk.name\":\"opentelemetry\",\"telemetry.sdk.version\":\"1.23.0\",\"user\":\"YWVkZWxlbnlp\"}},{\"traceId\":\"e0cb32bafc56f41920988b5189ae8fd3\",\"name\":\"GET\",\"id\":\"db42c88aed06ad0f\",\"kind\":\"CLIENT\",\"timestamp\":1713860461395000,\"duration\":547000,\"localEndpoint\":{\"serviceName\":\"snomio-ui\"},\"tags\":{\"http.method\":\"GET\",\"http.url\":\"https://uat-snomio.ihtsdotools.org/api/status\",\"http.response_content_length\":\"104\",\"http.status_code\":\"200\",\"http.status_text\":\"\",\"http.host\":\"uat-snomio.ihtsdotools.org\",\"http.scheme\":\"https\",\"http.user_agent\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36\",\"service.name\":\"snomio-ui\",\"telemetry.sdk.language\":\"webjs\",\"telemetry.sdk.name\":\"opentelemetry\",\"telemetry.sdk.version\":\"1.23.0\",\"user\":\"YWVkZWxlbnlp\"},\"annotations\":[{\"timestamp\":1713860461395000,\"value\":\"open\"},{\"timestamp\":1713860461395100,\"value\":\"send\"},{\"timestamp\":1713860461395300,\"value\":\"fetchStart\"},{\"timestamp\":1713860461395300,\"value\":\"domainLookupStart\"},{\"timestamp\":1713860461395300,\"value\":\"domainLookupEnd\"},{\"timestamp\":1713860461395300,\"value\":\"connectStart\"},{\"timestamp\":1713860461395300,\"value\":\"secureConnectionStart\"},{\"timestamp\":1713860461395300,\"value\":\"connectEnd\"},{\"timestamp\":1713860461397400,\"value\":\"requestStart\"},{\"timestamp\":1713860461940800,\"value\":\"responseStart\"},{\"timestamp\":1713860461941200,\"value\":\"responseEnd\"},{\"timestamp\":1713860461942000,\"value\":\"loaded\"}]}]";
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
    telemetryController.setSnomioEnvironment(SNOMIO_TEST_ENVIRONMENT);
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
    assertEquals(
        0,
        mockWebServer.getRequestCount(),
        "No requests should be sent to the server when telemetry is disabled");
  }

  @Test
  void testTelemetryForwardingToOTLP() throws Exception {
    mockWebServer.enqueue(new MockResponse().setResponseCode(200));
    telemetryController
        .forwardTelemetry(OTEL_TELEMETRY_EXAMPLE.getBytes(), createMockOtlpRequest())
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
    ObjectMapper mapper = new ObjectMapper();
    JsonNode requestBody = mapper.readTree(request.getBody().inputStream());

    for (JsonNode resourceSpan : requestBody.path("resourceSpans")) {
      JsonNode scopeSpans = resourceSpan.path("scopeSpans");
      for (JsonNode scopeSpan : scopeSpans) {
        JsonNode spans = scopeSpan.path("spans");
        for (JsonNode span : spans) {
          JsonNode attributes = span.path("attributes");
          for (JsonNode attribute : attributes) {
            if ("user".equals(attribute.path("key").asText())) {
              assertEquals(
                  USER_BASE64,
                  attribute.path("value").path("stringValue").asText(),
                  "The user attribute value does not match " + USER_BASE64);
            }
          }
        }
      }
    }
    JsonNode resourceSpans = requestBody.path("resourceSpans");
    if (!resourceSpans.isMissingNode() && resourceSpans.isArray()) {
      JsonNode firstSpan = resourceSpans.get(0);
      JsonNode resource = firstSpan.path("resource");
      JsonNode attributes = resource.path("attributes");
      boolean foundServiceName = false;
      for (JsonNode attribute : attributes) {
        if ("service.name".equals(attribute.path("key").asText())) {
          assertEquals(
              SNOMIO_TEST_ENVIRONMENT + "/" + "snomio-ui",
              attribute.path("value").path("stringValue").asText());
          foundServiceName = true;
          break;
        }
      }
      assertTrue(
          foundServiceName, "The 'service.name' attribute was not found in the telemetry data.");
    } else {
      fail("Invalid or missing 'resourceSpans' in the telemetry data.");
    }
  }

  @Test
  void testTelemetryForwardingToZipkin() throws Exception {
    mockWebServer.enqueue(new MockResponse().setResponseCode(200));
    telemetryController
        .forwardTelemetry(ZIPKIN_TELEMETRY_EXAMPLE.getBytes(), createMockZipkinRequest())
        .block();
    RecordedRequest request = mockWebServer.takeRequest(1, TimeUnit.SECONDS);
    assertNotNull(request);
    assertNull(request.getHeader(TRACEPARENT_HEADER));
    assertEquals(ZIPKIN_ENDPOINT, request.getPath());
    assertEquals("12345", request.getHeader(X_B3_TRACE_ID_HEADER));
    assertEquals("abcde", request.getHeader(X_B3_SPAN_ID_HEADER));
    assertEquals("fghij", request.getHeader(X_B3_PARENT_SPAN_ID_HEADER));
    assertEquals("1", request.getHeader(X_B3_SAMPLED_HEADER));
    assertEquals("1", request.getHeader(X_B3_FLAGS_HEADER));
    ObjectMapper mapper = new ObjectMapper();
    JsonNode requestBody = mapper.readTree(request.getBody().inputStream());
    String serviceName = requestBody.findPath("serviceName").asText();
    String userName = requestBody.findPath("user").asText();
    assertEquals(SNOMIO_TEST_ENVIRONMENT + "/" + "snomio-ui", serviceName);
    assertEquals(USER_BASE64, userName);
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
