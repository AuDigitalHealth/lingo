package com.csiro.tickets.helper;

import com.csiro.snomio.exception.SnomioProblem;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import org.apache.commons.logging.Log;
import org.springframework.http.HttpStatus;

public class SafeUtils {

  private SafeUtils() {
    throw new IllegalStateException("Utility class");
  }

  public static <T extends SnomioProblem> void checkFile(
      File originalFile, Class<T> exceptionClass) {
    T exception;
    try {
      exception = exceptionClass.getDeclaredConstructor().newInstance();
    } catch (InstantiationException
        | IllegalAccessException
        | NoSuchMethodException
        | InvocationTargetException e) {
      throw new SnomioProblem(
          "check-file-error",
          "Error instantiating exception: " + e.getMessage(),
          HttpStatus.INTERNAL_SERVER_ERROR);
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
