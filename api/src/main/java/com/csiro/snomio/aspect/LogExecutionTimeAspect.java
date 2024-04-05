package com.csiro.snomio.aspect;

import java.util.Arrays;
import java.util.logging.Level;
import lombok.extern.java.Log;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Log
@Aspect
@Component
public class LogExecutionTimeAspect {

  @Pointcut("@annotation(LogExecutionTime)")
  public void callAt() {}

  @Around("callAt()")
  public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
    long start = System.currentTimeMillis();

    Object proceed = joinPoint.proceed();

    long executionTime = System.currentTimeMillis() - start;

    if (log.isLoggable(Level.FINE)) {
      log.fine(joinPoint.getSignature() + " executed in " + executionTime + "ms");
      log.fine("Parameters: " + Arrays.toString(joinPoint.getArgs()));
    }
    return proceed;
  }
}
