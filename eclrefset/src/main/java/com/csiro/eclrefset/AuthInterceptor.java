package com.csiro.eclrefset;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

public class AuthInterceptor implements ClientHttpRequestInterceptor {

    private String token;
    private String cookieName;

    public AuthInterceptor(String cookieName, String token) {
        this.token = token;
        this.cookieName = cookieName;
    }

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        HttpHeaders headers = request.getHeaders();
        //headers.add("Authorization", "Bearer " + token);
        headers.add("Cookie", cookieName + "=" + token);
        return execution.execute(request, body);
    }
}