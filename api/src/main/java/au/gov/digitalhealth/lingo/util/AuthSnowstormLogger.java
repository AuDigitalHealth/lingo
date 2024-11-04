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
package au.gov.digitalhealth.lingo.util;

import au.gov.digitalhealth.lingo.auth.helper.AuthHelper;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.log.SnowstormLogger;
import java.util.logging.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthSnowstormLogger implements SnowstormLogger {
  private final Logger logger = Logger.getLogger(AuthSnowstormLogger.class.getName());
  private final AuthHelper authHelper;

  public AuthSnowstormLogger(AuthHelper authHelper) {
    if (authHelper == null) {
      throw new LingoProblem("auth", "AuthHelper is null", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    this.authHelper = authHelper;
  }

  @Override
  public void logFine(String message, Object... params) {
    String userLogin = authHelper.getImsUser().getLogin();
    logger.fine(() -> String.format("User %s %s", userLogin, String.format(message, params)));
  }
}
