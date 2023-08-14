package com.csiro.snomio.controllers;

import com.csiro.snomio.helper.AuthHelper;
import com.csiro.snomio.models.ImsUser;
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
    return user;
  }

  @GetMapping(value = "/logout")
  public void logout(HttpServletRequest request, HttpServletResponse response) {
    authHelper.cancelImsCookie(request, response);
  }
}
