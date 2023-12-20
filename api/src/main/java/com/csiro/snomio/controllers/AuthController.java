package com.csiro.snomio.controllers;

import com.csiro.snomio.helper.AuthHelper;
import com.csiro.snomio.auth.ImsUser;
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

  private final AuthHelper authHelper;

  @Autowired
  public AuthController(AuthHelper authHelper) {
    this.authHelper = authHelper;
  }

  @GetMapping(value = "")
  @ResponseBody
  public ImsUser auth(HttpServletRequest request) {
    return authHelper.getImsUser();
  }

  @GetMapping(value = "/logout")
  public void logout(HttpServletRequest request, HttpServletResponse response) {
    authHelper.cancelImsCookie(request, response);
  }
}
