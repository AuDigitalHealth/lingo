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
package au.gov.digitalhealth.lingo.auth.service;

import au.gov.digitalhealth.lingo.auth.exception.AuthenticationProblem;
import au.gov.digitalhealth.lingo.auth.helper.AuthHelper;
import au.gov.digitalhealth.lingo.auth.model.ImsUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class LoginService {

  public static final String USERS_CACHE = "users";
  private final WebClient imsApiClient;
  private final AuthHelper authHelper;

  @Autowired
  public LoginService(@Qualifier("imsApiClient") WebClient imsApiClient, AuthHelper authHelper) {
    this.imsApiClient = imsApiClient;
    this.authHelper = authHelper;
  }

  @Cacheable(cacheNames = USERS_CACHE, sync = true)
  public ImsUser getUserByToken(String cookie) throws AccessDeniedException {
    return imsApiClient
        .get()
        .uri("/api/account")
        .cookie(authHelper.getImsCookieName(), cookie)
        .retrieve()
        .onStatus(
            status -> status == HttpStatus.FORBIDDEN,
            clientResponse ->
                Mono.error(
                    new AuthenticationProblem(
                        "Forbidden looking up user based on supplied cookie")))
        .bodyToMono(ImsUser.class)
        .block();
  }
}
