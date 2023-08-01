package com.csiro.snomio.security;

import com.csiro.snomio.models.ImsUser;
import com.csiro.snomio.service.ImsRestClient;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import java.io.IOException;
import java.util.*;

@Component
public class CookieAuthenticationFilter extends OncePerRequestFilter {

  @Autowired
  private ImsRestClient imsRestClient;

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    try {
      Cookie cookie = WebUtils.getCookie(request, "uat-ims-ihtsdo");

      if (cookie == null) {
        throw new AccessDeniedException("no cookie recieved");
      }

      String cookieString = cookie.getValue();

      ImsUser user = imsRestClient.getUserByToken(cookieString);
      List<String> roles = user.getRoles();

      Set<GrantedAuthority> gas = new HashSet<>();

      for (String role : roles) {
        gas.add(new SimpleGrantedAuthority(role));
      }

      Authentication authentication = new UsernamePasswordAuthenticationToken(user, cookieString,
          gas);

      SecurityContextHolder.getContext().setAuthentication(authentication);

    } catch (AccessDeniedException ex) {
      logger.error("Could not validate cookie");
      response.sendError(403);
    }

    filterChain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();
    return !path.startsWith("/api");
  }
}
