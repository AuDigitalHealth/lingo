package com.csiro.snomio.log;

import java.util.logging.Logger;
import org.springframework.stereotype.Component;

@Component
public class DefaultSnowstormLogger implements SnowstormLogger {
  private final Logger logger = Logger.getLogger(DefaultSnowstormLogger.class.getName());

  @Override
  public void logFine(String message, Object... params) {
    logger.fine(String.format(message, params));
  }
}
