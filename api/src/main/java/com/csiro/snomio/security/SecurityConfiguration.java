package com.csiro.snomio.security;

import com.csiro.snomio.exception.CustomAccessDeniedHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

@Configuration
public class SecurityConfiguration {

  @Autowired CookieAuthenticationFilter cookieAuthenticationFilter;

  @Bean
  public AccessDeniedHandler accessDeniedHandler() {
    return new CustomAccessDeniedHandler();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    return http.addFilterAt(cookieAuthenticationFilter, BasicAuthenticationFilter.class)
        .authorizeHttpRequests(
            (requests) ->
                requests
                    .requestMatchers("/", "/assets", "/assets/*", "/index.html", "/vite.svg")
                    .anonymous()
                    .requestMatchers("/api/**")
                    .hasRole("ms-australia")
                    .anyRequest()
                    .anonymous())
        .build();
  }
}
