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
package au.gov.digitalhealth.lingo.auth.security;

import au.gov.digitalhealth.lingo.auth.exception.AuthenticationProblem;
import au.gov.digitalhealth.lingo.auth.helper.AuthHelper;
import au.gov.digitalhealth.lingo.auth.model.ImsUser;
import au.gov.digitalhealth.lingo.auth.service.LoginService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Component
public class CookieAuthenticationFilter extends OncePerRequestFilter {

  private final LoginService loginService;

  private final AuthHelper authHelper;

  private final HandlerExceptionResolver handlerExceptionResolver;

  @Autowired
  public CookieAuthenticationFilter(
      LoginService loginService,
      AuthHelper authHelper,
      HandlerExceptionResolver handlerExceptionResolver) {
    this.loginService = loginService;
    this.authHelper = authHelper;
    this.handlerExceptionResolver = handlerExceptionResolver;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    try {
      Cookie cookie = authHelper.getImsCookie(request);

      if (cookie == null) {
        throw new AuthenticationProblem("No cookie received");
      }

      String cookieString = cookie.getValue();

      ImsUser user = loginService.getUserByToken(cookieString);
      List<String> roles = user.getRoles();

      Set<GrantedAuthority> gas = new HashSet<>();

      for (String role : roles) {
        gas.add(new SimpleGrantedAuthority(role));
      }

      Authentication authentication =
          new UsernamePasswordAuthenticationToken(user, cookieString, gas);

      SecurityContextHolder.getContext().setAuthentication(authentication);
      filterChain.doFilter(request, response);

    } catch (AuthenticationProblem ex) {
      logger.error("Could not validate cookie");
      handlerExceptionResolver.resolveException(request, response, null, ex);
    }
  }

  @Override
  protected boolean shouldNotFilterAsyncDispatch() {
    return false;
  }

  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
    String path = request.getServletPath();
    return !path.startsWith("/api");
  }
}
