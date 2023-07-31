package com.csiro.snomio.controllers;

import com.csiro.snomio.models.ImsUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

@RestController
@RequestMapping(value = "/api/auth", produces = {MediaType.APPLICATION_JSON_VALUE})
public class AuthController {

  @Value("${ims.api.cookie.name}")
  String imsCookieName;

  @GetMapping(value="")
  @ResponseBody
  public ImsUser auth(HttpServletRequest request, Authentication authentication) {
    ImsUser user = (ImsUser) authentication.getPrincipal();
    Cookie imsCookie = WebUtils.getCookie(request, imsCookieName);
    System.out.println(imsCookie);
    return user;
  }

  @GetMapping(value="/logout")
  public void logout(HttpServletRequest request, HttpServletResponse response) {
    boolean hello = true;
    hello = false;
    if(hello){
      System.out.println("hello");
    }
    Cookie imsCookie = WebUtils.getCookie(request, imsCookieName);
    System.out.println(imsCookie.getValue());
    if (imsCookie != null) {
      imsCookie.setMaxAge(0);
      imsCookie.setDomain("ihtsdotools.org");
      imsCookie.setPath("/");
      imsCookie.setSecure(true);
    }
    response.addCookie(imsCookie);

  }
}
