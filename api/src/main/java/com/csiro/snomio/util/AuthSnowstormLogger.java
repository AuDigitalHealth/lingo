package com.csiro.snomio.util;

import com.csiro.snomio.auth.helper.AuthHelper;
import com.csiro.snomio.exception.SnomioProblem;
import com.csiro.snomio.log.SnowstormLogger;
import java.util.logging.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthSnowstormLogger implements SnowstormLogger {
  private final Logger logger = Logger.getLogger(AuthSnowstormLogger.class.getName());
  private final AuthHelper authHelper;

  public AuthSnowstormLogger(AuthHelper authHelper) {
    if (authHelper == null) {
      throw new SnomioProblem("auth", "AuthHelper is null", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    this.authHelper = authHelper;
  }

  @Override
  public void logFine(String message, Object... params) {
    String userLogin = authHelper.getImsUser().getLogin();
    logger.fine(String.format("User " + userLogin + " " + message, params));
  }
}
