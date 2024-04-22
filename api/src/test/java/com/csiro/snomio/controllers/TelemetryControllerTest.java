package com.csiro.snomio.controllers;

import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.OK;
import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;
import com.csiro.tickets.TicketTestBaseLocal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.module.mockmvc.RestAssuredMockMvc;
import io.restassured.response.Response;
import reactor.core.publisher.Mono;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.RequestBodySpec;
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec;
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersUriSpec;
import org.springframework.web.reactive.function.client.WebClient.ResponseSpec;



@AutoConfigureMockMvc
@ActiveProfiles("test")
class TelemetryControllerTest extends TicketTestBaseLocal {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private WebClient.Builder webClientBuilder;

    private WebClient webClient;

    private TelemetryController telemetryController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    private void setupTest() {
        MockitoAnnotations.openMocks(this); // Initialize annotations
        webClientBuilder =  Mockito.mock(WebClient.Builder.class);
        when(webClientBuilder.baseUrl("http://localhost")).thenReturn(webClientBuilder);
        webClient = Mockito.mock(WebClient.class);
        RestAssuredMockMvc.webAppContextSetup(webApplicationContext);
        telemetryController = new TelemetryController(webClientBuilder); 
    }

    @Test
    void testForwardTelemetryDisabled() {
        when(telemetryController.isTelemetryEnabled()).thenReturn(false);

        byte[] telemetryData = "dummy data".getBytes();
        Response response = withAuth()
            .contentType(APPLICATION_JSON_VALUE)
            .body(telemetryData)
            .post("/api/telemetry");

        response.then().statusCode(200); // Expecting empty mono to complete successfully
    }

    @Test
    void testForwardTelemetryOtelFormat() {
        setupSecurityContext("adminUser");
        when(telemetryController.isTelemetryEnabled()).thenReturn(true);

        JsonNode otelData = createOtelJson();
        byte[] telemetryData = otelData.toString().getBytes();
        mockWebClient(OK.value(), telemetryController.getOtelExporterEndpoint());

        Response response = withAuth()
            .contentType(APPLICATION_JSON_VALUE)
            .body(telemetryData)
            .post("/api/telemetry");

        response.then().statusCode(200);
    }

    @Test
    void testForwardTelemetryZipkinFormat() {
        setupSecurityContext("adminUser");
        when(telemetryController.isTelemetryEnabled()).thenReturn(true);

        JsonNode zipkinData = createZipkinJson();
        byte[] telemetryData = zipkinData.toString().getBytes();
        mockWebClient(OK.value(), telemetryController.getZipkinExporterEndpoint());

        Response response = withAuth()
            .contentType(APPLICATION_JSON_VALUE)
            .body(telemetryData)
            .post("/api/telemetry");

        response.then().statusCode(200);
    }

    @Test
    void testForwardTelemetryWithIncorrectFormat() {
        setupSecurityContext("adminUser");
        when(telemetryController.isTelemetryEnabled()).thenReturn(true);

        byte[] invalidData = "invalid data".getBytes();

        Response response = withAuth()
            .contentType(APPLICATION_JSON_VALUE)
            .body(invalidData)
            .post("/api/telemetry");

        response.then().statusCode(400); // Expecting Mono.error() to propagate
    }

    private void mockWebClient(int statusCode, String endpoint) {
        ResponseSpec responseSpec = Mockito.mock(ResponseSpec.class);
        Mockito.when(responseSpec.bodyToMono(Void.class)).thenReturn(Mono.empty());
    
        RequestBodySpec requestBodySpec = Mockito.mock(RequestBodySpec.class);
        RequestHeadersSpec<?> requestHeadersSpec = Mockito.mock(RequestHeadersSpec.class);
        Mockito.when(requestBodySpec.contentType(Mockito.<MediaType>any())).thenReturn(requestBodySpec);
        Mockito.when(requestBodySpec.bodyValue(Mockito.any())).thenReturn(requestHeadersSpec);
        Mockito.when(requestBodySpec.retrieve()).thenReturn(responseSpec);
    
        RequestHeadersUriSpec<?> requestHeadersUriSpec = Mockito.mock(RequestHeadersUriSpec.class);
        Mockito.when(requestHeadersUriSpec.uri(Mockito.eq(endpoint))).thenReturn(requestBodySpec);
    
        WebClient webClient = Mockito.mock(WebClient.class);
        Mockito.when(webClient.post()).thenReturn(requestHeadersUriSpec);
    
        telemetryController.setWebClient(webClient); // Ensure this is done only after all mocks are correctly setup
    }

    private JsonNode createOtelJson() {
        // Construct valid OTEL JSON based on your data model
        return objectMapper.createObjectNode();
    }

    private JsonNode createZipkinJson() {
        // Construct valid Zipkin JSON based on your data model
        return objectMapper.createArrayNode();
    }

    private void setupSecurityContext(String username) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(username, null);
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
}
