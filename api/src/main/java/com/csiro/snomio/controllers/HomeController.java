package com.csiro.snomio.controllers;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.java.Log;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

@RestController
@RequestMapping("/api")
@Log
public class HomeController {
  @GetMapping("")
  public String index(HttpServletRequest request) {
    Cookie cookie = WebUtils.getCookie(request, "uat-ims-ihtsdo");
    String cookieString = cookie == null ? null : cookie.getValue();
    log.info("/api");
    return cookieString;
  }

  @GetMapping("/author")
  public String author(HttpServletRequest request) {
    log.info("/author");
    return "u r author";
  }

  @GetMapping("/impossible")
  public String impossible(HttpServletRequest request) {
    log.info("/impossible");
    return "u r impossible";
  }
}
