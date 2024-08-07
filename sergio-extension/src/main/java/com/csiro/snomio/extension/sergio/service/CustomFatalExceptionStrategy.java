package com.csiro.snomio.extension.sergio.service;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.listener.ConditionalRejectingErrorHandler;
import org.springframework.amqp.rabbit.support.ListenerExecutionFailedException;

public class CustomFatalExceptionStrategy
    extends ConditionalRejectingErrorHandler.DefaultExceptionStrategy {
  private static final Log log = LogFactory.getLog(CustomFatalExceptionStrategy.class);

  @Override
  public boolean isFatal(Throwable t) {
    if (t instanceof ListenerExecutionFailedException e) {
      Message failedMessage = e.getFailedMessage();
      log.error("Failed message: " + failedMessage);
    }
    return super.isFatal(t);
  }
}
