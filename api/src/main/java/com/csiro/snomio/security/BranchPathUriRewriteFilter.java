package com.csiro.snomio.security;

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
