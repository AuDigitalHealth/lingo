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
package au.gov.digitalhealth.lingo.controllers;

import au.gov.digitalhealth.lingo.auth.helper.AuthHelper;
import au.gov.digitalhealth.lingo.auth.model.ImsUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api/auth",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class AuthController {

  private final AuthHelper authHelper;

  public AuthController(AuthHelper authHelper) {
    this.authHelper = authHelper;
  }

  @GetMapping(value = "")
  public ImsUser auth(HttpServletRequest request) {
    return authHelper.getImsUser();
  }

  @PostMapping(value = "/logout")
  public void logout(HttpServletRequest request, HttpServletResponse response) {
    authHelper.cancelImsCookie(request, response);
  }
}
