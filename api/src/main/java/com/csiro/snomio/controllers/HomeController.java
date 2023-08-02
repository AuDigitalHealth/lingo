package com.csiro.snomio.controllers;

import com.csiro.snomio.models.ImsUser;
import com.csiro.snomio.security.auth.AuthHelper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

@RestController
@RequestMapping("/api")
public class HomeController {
  @Autowired private AuthHelper authHelper;

  @GetMapping("")
  public String index(HttpServletRequest request) {
    Cookie cookie = WebUtils.getCookie(request, "uat-ims-ihtsdo");
    String cookieString = cookie.getValue();
    System.out.println("/api");
    return cookieString;
  }

  @GetMapping("/author")
  public String author(HttpServletRequest request) {
    ImsUser user = authHelper.getImsUser();
    System.out.println("/author");
    return "u r author";
  }

  @GetMapping("/impossible")
  public String impossible(HttpServletRequest request) {
    System.out.println("/impossible");
    return "u r impossible";
  }
}
