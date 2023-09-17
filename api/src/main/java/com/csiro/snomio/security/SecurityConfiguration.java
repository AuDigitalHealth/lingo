package com.csiro.snomio.security;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

  @Value("${security.enable-csrf}")
  private boolean csrfEnabled;

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http, CookieAuthenticationFilter cookieAuthenticationFilter) throws Exception {
    if (!csrfEnabled) {
      http.csrf(AbstractHttpConfigurer::disable);
    }
    http.headers().frameOptions().disable();
    http.addFilterAt(cookieAuthenticationFilter, BasicAuthenticationFilter.class)
        .authorizeHttpRequests(
            requests ->
                requests
                    // https://github.com/jzheaux/cve-2023-34035-mitigations
                    .requestMatchers(
                        antMatcher("/"),
                        antMatcher("/assets"),
                        antMatcher("/assets/*"),
                        antMatcher("/index.html"),
                        antMatcher("/vite.svg"))
                    .anonymous()
                    .requestMatchers(antMatcher("/api/h2-console/**"))
                    .permitAll()
                    .requestMatchers(antMatcher("/api/**"))
                    .hasRole("ms-australia")
                    .anyRequest()
                    .anonymous());

    return http.build();
  }

  @Bean
  MvcRequestMatcher.Builder mvc(HandlerMappingIntrospector introspector) {
    return new MvcRequestMatcher.Builder(introspector);
  }
}
