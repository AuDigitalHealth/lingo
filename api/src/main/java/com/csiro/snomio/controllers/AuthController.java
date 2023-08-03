package com.csiro.snomio.controllers;

import com.csiro.snomio.helper.AuthHelper;
import com.csiro.snomio.models.ImsUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api/auth",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class AuthController {

  @Autowired private AuthHelper authHelper;

  @GetMapping(value = "")
  @ResponseBody
  public ImsUser auth(HttpServletRequest request) {
    ImsUser user = authHelper.getImsUser();
    Cookie imsCookie = authHelper.getImsCookie(request);
    System.out.println(imsCookie);
    return user;
  }

  @GetMapping(value = "/logout")
  public void logout(HttpServletRequest request, HttpServletResponse response) {
    boolean hello = true;
    hello = false;
    if (hello) {
      System.out.println("hello");
    }
    Cookie imsCookie = authHelper.getImsCookie(request);
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
