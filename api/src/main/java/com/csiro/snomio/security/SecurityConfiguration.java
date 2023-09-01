package com.csiro.snomio.security;

import com.csiro.snomio.exception.CustomAccessDeniedHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.zalando.problem.spring.web.advice.security.SecurityProblemSupport;

@Configuration
@Import(SecurityProblemSupport.class)
public class SecurityConfiguration {

  @Value("${security.enable-csrf}")
  private boolean csrfEnabled;

  @Bean
  public AccessDeniedHandler accessDeniedHandler() {
    return new CustomAccessDeniedHandler();
  }

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http,
      CookieAuthenticationFilter cookieAuthenticationFilter,
      SecurityProblemSupport problemSupport)
      throws Exception {
    if (!csrfEnabled) {
      http.csrf(AbstractHttpConfigurer::disable);
    }

    // Do we want access denied to redirect to /access-denied? Or is it better to return a 403 with
    // a JSON
    // payload and let the UI determine what to do? (which might be redirect to /access-denied or
    // something else)
    http.exceptionHandling(
        exceptionHandling -> {
          exceptionHandling.authenticationEntryPoint(problemSupport);
          exceptionHandling.accessDeniedHandler(problemSupport);
        });

    http.addFilterAt(cookieAuthenticationFilter, BasicAuthenticationFilter.class)
        .authorizeHttpRequests(
            requests ->
                requests
                    .requestMatchers("/", "/assets", "/assets/*", "/index.html", "/vite.svg")
                    .anonymous()
                    .requestMatchers("/api/h2-console/**")
                    .permitAll()
                    .requestMatchers("/api/**")
                    .hasRole("ms-australia")
                    .anyRequest()
                    .anonymous());
    return http.build();
  }
}
