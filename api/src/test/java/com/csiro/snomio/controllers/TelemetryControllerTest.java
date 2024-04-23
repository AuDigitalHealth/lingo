package com.csiro.snomio.controllers;

import com.csiro.snomio.SnomioTestBase;
import com.csiro.snomio.auth.model.ImsUser;
import com.csiro.snomio.auth.security.CookieAuthenticationFilter;
import com.csiro.snomio.exception.TelemetryProblem;
import com.csiro.snomio.validation.OnlyOneNotEmpty;
import com.csiro.snomio.validation.OnlyOneNotEmptyValidation;
import com.csiro.tickets.TicketTestBaseLocal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintValidatorContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.MockitoJUnitRunner;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.RequestBodySpec;
import org.springframework.web.reactive.function.client.WebClient.RequestBodyUriSpec;
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec;
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersUriSpec;
import org.springframework.web.reactive.function.client.WebClient.ResponseSpec;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
class TelemetryControllerTest {

    @Mock
    private WebClient zipkinClient;

    @Mock
    private WebClient otlpClient;

    @Mock
    private HttpServletRequest request;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @MockBean
    CookieAuthenticationFilter cookieAuthenticationFilter;

    @InjectMocks
    private OnlyOneNotEmptyValidation onlyOneNotEmptyValidation;

    @Mock
    private ConstraintValidatorContext constraintValidatorContext;

    @InjectMocks
    private TelemetryController telemetryController;
    private ObjectMapper objectMapper;

    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);

        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);        
        telemetryController = new TelemetryController(zipkinClient, otlpClient);
        telemetryController.setTelemetryEnabled(true);
        telemetryController.setOtelExporterEndpoint("http://otel-exporter.com");
        telemetryController.setZipkinExporterEndpoint("http://zipkin-exporter.com");
        objectMapper = new ObjectMapper();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        Map<String, Object> user = new HashMap<String, Object>();
        user.put("login", "test");
        user.put("firstName", "test");
        user.put("email", "test@test.com");
        user.put("langKey", "en");
        List<String> roles = Arrays.asList("ms-australia");
        user.put("roles", roles);
        when(authentication.getPrincipal()).thenReturn(new ImsUser(user));
    }


    @Test
    void testForwardTelemetryOTEL() throws JsonProcessingException {
        JsonNode root = objectMapper.readTree("{\"resourceSpans\":[{\"resource\":{\"attributes\":[{\"key\":\"service.name\",\"value\":{\"stringValue\":\"snomio-ui\"}},{\"key\":\"telemetry.sdk.language\",\"value\":{\"stringValue\":\"webjs\"}},{\"key\":\"telemetry.sdk.name\",\"value\":{\"stringValue\":\"opentelemetry\"}},{\"key\":\"telemetry.sdk.version\",\"value\":{\"stringValue\":\"1.23.0\"}}],\"droppedAttributesCount\":0},\"scopeSpans\":[{\"scope\":{\"name\":\"@opentelemetry/instrumentation-xml-http-request\",\"version\":\"0.50.0\"},\"spans\":[{\"traceId\":\"36a11cb339b5957b7666916062140b87\",\"spanId\":\"87df0287278f2b83\",\"name\":\"GET\",\"kind\":3,\"startTimeUnixNano\":\"1713702779032000000\",\"endTimeUnixNano\":\"1713702779033000000\",\"attributes\":[{\"key\":\"http.method\",\"value\":{\"stringValue\":\"GET\"}},{\"key\":\"http.url\",\"value\":{\"stringValue\":\"https://uat-snomio.ihtsdotools.org/authoring-services/authoring-services-websocket/info?t=1713702779020\"}},{\"key\":\"http.status_code\",\"value\":{\"intValue\":0}},{\"key\":\"http.status_text\",\"value\":{\"stringValue\":\"\"}},{\"key\":\"http.host\",\"value\":{\"stringValue\":\"uat-snomio.ihtsdotools.org\"}},{\"key\":\"http.scheme\",\"value\":{\"stringValue\":\"https\"}},{\"key\":\"http.user_agent\",\"value\":{\"stringValue\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36\"}}],\"droppedAttributesCount\":0,\"events\":[{\"attributes\":[],\"name\":\"open\",\"timeUnixNano\":\"1713702779032000000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"send\",\"timeUnixNano\":\"1713702779032000000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"abort\",\"timeUnixNano\":\"1713702779033000000\",\"droppedAttributesCount\":0}],\"droppedEventsCount\":0,\"status\":{\"code\":0},\"links\":[],\"droppedLinksCount\":0},{\"traceId\":\"164fe794fd608e5e3daa0cbdd6f68278\",\"spanId\":\"1d9cc86c16482ddf\",\"name\":\"GET\",\"kind\":3,\"startTimeUnixNano\":\"1713702839031000000\",\"endTimeUnixNano\":\"1713702839049000000\",\"attributes\":[{\"key\":\"http.method\",\"value\":{\"stringValue\":\"GET\"}},{\"key\":\"http.url\",\"value\":{\"stringValue\":\"https://uat-snomio.ihtsdotools.org/authoring-services/authoring-services-websocket/info?t=1713702839023\"}},{\"key\":\"http.status_code\",\"value\":{\"intValue\":0}},{\"key\":\"http.status_text\",\"value\":{\"stringValue\":\"\"}},{\"key\":\"http.host\",\"value\":{\"stringValue\":\"uat-snomio.ihtsdotools.org\"}},{\"key\":\"http.scheme\",\"value\":{\"stringValue\":\"https\"}},{\"key\":\"http.user_agent\",\"value\":{\"stringValue\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36\"}}],\"droppedAttributesCount\":0,\"events\":[{\"attributes\":[],\"name\":\"open\",\"timeUnixNano\":\"1713702839031000000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"send\",\"timeUnixNano\":\"1713702839031100000\",\"droppedAttributesCount\":0},{\"attributes\":[],\"name\":\"abort\",\"timeUnixNano\":\"1713702839049000000\",\"droppedAttributesCount\":0}],\"droppedEventsCount\":0,\"status\":{\"code\":0},\"links\":[],\"droppedLinksCount\":0}]}]}]}");
        byte[] telemetryData = objectMapper.writeValueAsBytes(root);

        // final var mock = Mockito.mock(WebClient.class);
        // final var uriSpecMock = Mockito.mock(WebClient.RequestHeadersUriSpec.class);
        // final var headersSpecMock = Mockito.mock(WebClient.RequestHeadersSpec.class);
        // final var responseSpecMock = Mockito.mock(WebClient.ResponseSpec.class);        
        // final var requestBodyUriSpec = Mockito.mock(WebClient.RequestBodyUriSpec.class);        

        RequestBodyUriSpec requestBodyUriSpec = mock(WebClient.RequestBodyUriSpec.class);
        RequestHeadersUriSpec requestHeadersUriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        ResponseSpec responseSpec = mock(WebClient.ResponseSpec.class);
        RequestHeadersSpec requestHeadersSpec = mock(WebClient.RequestHeadersSpec.class);
        RequestBodySpec requestBodySpec = mock(WebClient.RequestBodySpec.class);

        when(otlpClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.headers(any())).thenReturn(requestBodySpec); // if headers are used
        when(requestBodySpec.retrieve()).thenReturn(responseSpec); // Corrected here
        when(responseSpec.bodyToMono(Void.class)).thenReturn(Mono.empty());

        // Now this line should work as expected in your test
        // otlpClient.post().bodyValue(telemetryData).retrieve().bodyToMono(Void.class);

        // StepVerifier.create(telemetryController.forwardTelemetry(telemetryData, request))
        //         .verifyComplete();
    }

    // @Test
    // void testForwardTelemetryZipkin() throws JsonProcessingException {
    //     JsonNode root = objectMapper.readTree("[{\"traceId\":\"abc\"}]");
    //     byte[] telemetryData = objectMapper.writeValueAsBytes(root);

    //     when(zipkinClient.post())
    //             .thenReturn(WebClient.builder().build().post());
    //     when(zipkinClient.post().bodyValue(anyString()))
    //             .thenReturn(WebClient.builder().build().post().bodyValue(""));
    //     when(zipkinClient.post().bodyValue("").retrieve().bodyToMono(Void.class))
    //             .thenReturn(Mono.empty());

    //     StepVerifier.create(telemetryController.forwardTelemetry(telemetryData, request))
    //             .verifyComplete();
    // }

    // @Test
    // void testForwardTelemetryError() throws JsonProcessingException {
    //     JsonNode root = objectMapper.readTree("{\"resourceSpans\":[]}");
    //     byte[] telemetryData = objectMapper.writeValueAsBytes(root);

    //     when(otlpClient.post())
    //             .thenReturn(WebClient.builder().build().post());
    //     when(otlpClient.post().bodyValue(anyString()))
    //             .thenReturn(WebClient.builder().build().post().bodyValue(""));
    //     when(otlpClient.post().bodyValue("").retrieve().bodyToMono(Void.class))
    //             .thenReturn(Mono.error(new RuntimeException("Test exception")));

    //     StepVerifier.create(telemetryController.forwardTelemetry(telemetryData, request))
    //             .expectError(TelemetryProblem.class)
    //             .verify();
    // }

    // @Test
    // void testAddExtraInfoOTEL() throws JsonProcessingException {
    //     JsonNode root = objectMapper.readTree("{\"resourceSpans\":[{\"scopeSpans\":[{\"spans\":[{}]}]}]}");
    //     String user = Base64.getEncoder().encodeToString("testuser".getBytes());

    //     String result = telemetryController.addExtraInfo(root, telemetryController.getOtelExporterEndpoint(), user);
    //     JsonNode resultNode = objectMapper.readTree(result);

    //     JsonNode attributesNode = resultNode.path("resourceSpans").get(0).path("scopeSpans").get(0).path("spans").get(0).path("attributes");
    //     boolean hasUserAttribute = false;
    //     for (JsonNode attribute : attributesNode) {
    //         if (attribute.path("key").asText().equals("user.name") && attribute.path("value").path("stringValue").asText().equals(user)) {
    //             hasUserAttribute = true;
    //             break;
    //         }
    //     }

    //     assert hasUserAttribute;
    // }

    // @Test
    // void testAddExtraInfoZipkin() throws JsonProcessingException {
    //     JsonNode root = objectMapper.readTree("[{}]");
    //     String user = Base64.getEncoder().encodeToString("testuser".getBytes());

    //     String result = telemetryController.addExtraInfo(root, telemetryController.getZipkinExporterEndpoint(), user);
    //     JsonNode resultNode = objectMapper.readTree(result);

    //     JsonNode tags = resultNode.get(0).path("tags");
    //     assert tags.path("user").asText().equals(user);
    // }

    // @Test
    // void testCopyTraceHeadersOTEL() {
    //     when(request.getHeader("traceparent")).thenReturn("traceparent-value");
    //     HttpHeaders headers = new HttpHeaders();

    //     telemetryController.copyTraceHeaders(request, headers, telemetryController.getOtelExporterEndpoint());

    //     assert headers.getFirst("traceparent").equals("traceparent-value");
    // }

    // @Test
    // void testCopyTraceHeadersZipkin() {
    //     when(request.getHeader("X-B3-TraceId")).thenReturn("traceId-value");
    //     when(request.getHeader("X-B3-SpanId")).thenReturn("spanId-value");
    //     HttpHeaders headers = new HttpHeaders();

    //     telemetryController.copyTraceHeaders(request, headers, telemetryController.getZipkinExporterEndpoint());

    //     assert headers.getFirst("X-B3-TraceId").equals("traceId-value");
    //     assert headers.getFirst("X-B3-SpanId").equals("spanId-value");
    // }

    // @Test
    // void testDetermineEndpointOTEL() throws JsonProcessingException {
    //     JsonNode root = objectMapper.readTree("{\"resourceSpans\":[]}");
    //     String endpoint = telemetryController.determineEndpoint(root);
    //     assert endpoint.equals(telemetryController.getOtelExporterEndpoint()
    //     assert endpoint.equals(telemetryController.otelExporterEndpoint);
    // }

    // @Test
    // void testDetermineEndpointZipkin() throws JsonProcessingException {
    //     // JsonNode root = objectMapper.readTree("[{}]");
    //     // String endpoint = telemetryController
    // }
}