/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.security;

import static org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher;

import au.gov.digitalhealth.lingo.auth.security.CookieAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig;
import org.springframework.security.task.DelegatingSecurityContextAsyncTaskExecutor;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

  @Value("${security.enable-csrf}")
  private boolean csrfEnabled;

  @SuppressWarnings("java:S4502")
  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http, CookieAuthenticationFilter cookieAuthenticationFilter) throws Exception {
    if (!csrfEnabled) {
      http.csrf(AbstractHttpConfigurer::disable);
    }
    http.headers(headers -> headers.frameOptions(FrameOptionsConfig::disable));
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
  public FilterRegistrationBean<BranchPathUriRewriteFilter> getUrlRewriteFilter() {
    // Encode branch paths in uri to allow request mapping to work
    return new FilterRegistrationBean<>(
        new BranchPathUriRewriteFilter(
            "/api/(.*)/medications/.*",
            "/api/(.*)/devices/.*",
            "/api/(.*)/qualifier/.*",
            "/api/(.*)/product-model/.*",
            "/api/(.*)/product-model-graph/.*"));
  }

  @Bean
  public ThreadPoolTaskExecutor threadPoolTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(10);
    executor.setMaxPoolSize(100);
    executor.setQueueCapacity(50);
    executor.setThreadNamePrefix("async-");
    return executor;
  }

  @Bean
  public DelegatingSecurityContextAsyncTaskExecutor taskExecutor(ThreadPoolTaskExecutor delegate) {
    return new DelegatingSecurityContextAsyncTaskExecutor(delegate);
  }
}
