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
package au.gov.digitalhealth.tickets.helper;

import au.gov.digitalhealth.lingo.exception.LingoProblem;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import org.apache.commons.logging.Log;
import org.springframework.http.HttpStatus;

public class SafeUtils {

  private SafeUtils() {
    throw new IllegalStateException("Utility class");
  }

  public static <T extends LingoProblem> void checkFile(
      File originalFile, String allowedImportDirectory, Class<T> exceptionClass) {
    T exception;
    try {
      exception = exceptionClass.getDeclaredConstructor().newInstance();
    } catch (InstantiationException
        | IllegalAccessException
        | NoSuchMethodException
        | InvocationTargetException e) {
      throw new LingoProblem(
          "check-file-error",
          "Error instantiating exception: " + e.getMessage(),
          HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (originalFile == null) {
      exception.setDetail("File location cannot be null!");
      throw exception;
    }
    try {
      String canonicalOriginalFilePath = originalFile.getCanonicalPath();
      if (canonicalOriginalFilePath.contains("..")) {
        exception.setDetail("Invalid file path provided. Don't use .. in your file path!");
        throw exception;
      }
    } catch (IOException e) {
      exception.setDetail("Issue while checking file paths: " + e.getMessage());
      throw exception;
    }
    if (!originalFile.toPath().normalize().startsWith(allowedImportDirectory)) {
      exception.setDetail("Entry is outside of the allowed import directory");
      throw exception;
    }
    if (!originalFile.exists()) {
      exception.setDetail("File doesn't exist: " + originalFile.getAbsolutePath());
      throw exception;
    }
  }

  public static void loginfo(Log logger, String message) {
    if (message != null) {
      message = message.replaceAll("[\n\r]", "_");
      logger.info(message);
    }
  }
}
