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

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.java.Log;

/** Filter used to handle variable length branch parameters in request paths. */
@Log
public class BranchPathUriRewriteFilter implements Filter {

  public static final String ORIGINAL_BRANCH_PATH_URI = "originalBranchPathURI";
  private final List<Pattern> patterns = new ArrayList<>();

  public BranchPathUriRewriteFilter(String... patternStrings) {
    this.patterns.addAll(Arrays.stream(patternStrings).map(Pattern::compile).toList());
  }

  public void doFilter(
      ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
      throws IOException, ServletException {
    HttpServletRequest request = (HttpServletRequest) servletRequest;
    if (servletRequest.getAttribute(ORIGINAL_BRANCH_PATH_URI) == null) {
      String originalRequestURI = request.getRequestURI();
      String contextPath = request.getContextPath();
      if (contextPath != null) {
        originalRequestURI = originalRequestURI.substring(contextPath.length());
      }

      final String rewrittenRequestURI = this.rewriteUri(originalRequestURI);
      if (rewrittenRequestURI != null) {
        servletRequest =
            new HttpServletRequestWrapper(request) {
              @Override
              public String getRequestURI() {
                return rewrittenRequestURI;
              }

              @Override
              public String getContextPath() {
                return "/";
              }
            };
        servletRequest.setAttribute(ORIGINAL_BRANCH_PATH_URI, originalRequestURI);
        servletRequest
            .getRequestDispatcher(rewrittenRequestURI)
            .forward(servletRequest, servletResponse);
        return;
      }
    }

    filterChain.doFilter(servletRequest, servletResponse);
  }

  private String rewriteUri(String requestURI) {
    if (requestURI != null) {
      for (Pattern pattern : patterns) {
        Matcher matcher = pattern.matcher(requestURI);
        if (matcher.matches()) {
          String path = matcher.group(1);
          String rewrittenURI = requestURI.replace(path, BranchPathUriUtil.encodePath(path));
          log.fine(
              () ->
                  String.format(
                      "Request URI '{}' matches pattern '{}', rewritten URI '{}'",
                      requestURI,
                      pattern,
                      rewrittenURI));
          return rewrittenURI;
        }
      }
    }

    return null;
  }
}
