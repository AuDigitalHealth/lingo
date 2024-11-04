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
package au.gov.digitalhealth.lingo.aspect;

import au.gov.digitalhealth.lingo.auth.helper.AuthHelper;
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

  final AuthHelper authHelper;

  public LogExecutionTimeAspect(AuthHelper authHelper) {
    this.authHelper = authHelper;
  }

  @Pointcut("@annotation(au.gov.digitalhealth.lingo.aspect.LogExecutionTime)")
  public void callAt() {}

  @Around("callAt()")
  public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
    long start = System.currentTimeMillis();

    Object proceed = joinPoint.proceed();

    long executionTime = System.currentTimeMillis() - start;

    if (log.isLoggable(Level.FINE)) {
      log.fine(
          joinPoint.getSignature()
              + " for user "
              + authHelper.getImsUser().getLogin()
              + " executed in "
              + executionTime
              + "ms");
      log.fine("Parameters: " + Arrays.toString(joinPoint.getArgs()));
    }
    return proceed;
  }
}
