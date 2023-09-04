package com.csiro.snomio.security;

import com.csiro.snomio.exception.CustomAccessDeniedHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

@Configuration
public class SecurityConfiguration {

  @Value("${security.enable-csrf}")
  private boolean csrfEnabled;

  @Bean
  public AccessDeniedHandler accessDeniedHandler() {
    return new CustomAccessDeniedHandler();
  }

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http, CookieAuthenticationFilter cookieAuthenticationFilter) throws Exception {
    if (!csrfEnabled) {
      http.csrf(AbstractHttpConfigurer::disable);
    }

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
