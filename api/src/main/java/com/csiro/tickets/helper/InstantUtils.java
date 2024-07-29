package com.csiro.tickets.helper;

import com.csiro.snomio.exception.DateFormatProblem;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class InstantUtils {

  public static final String YYYY_MM_DD_T_HH_MM_SS_SSSXXX = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";

  private InstantUtils() {}

  public static Instant convert(String source) {
    if (source.isEmpty()) return null;

    // Try parsing with "dd/MM/yyyy" format
    try {
      LocalDate localDate = LocalDate.parse(source, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
      return convertLocalDateToInstant(localDate);
    } catch (Exception e) {
      // If parsing with "dd/MM/yyyy" format fails, try "dd/MM/yy" format
      try {
        LocalDate localDate = LocalDate.parse(source, DateTimeFormatter.ofPattern("dd/MM/yy"));
        return convertLocalDateToInstant(localDate);
      } catch (Exception ex) {
        // If parsing with "dd/MM/yy" format also fails, try ISO format
        try {
          ZonedDateTime zonedDateTime =
              ZonedDateTime.parse(source, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
          return zonedDateTime.toInstant();
        } catch (Exception exc) {
          // If all parsing attempts fail, throw an exception or handle it accordingly
          throw new IllegalArgumentException("Unsupported date format: " + source);
        }
      }
    }
  }

  public static Instant convertLocalDateToInstant(LocalDate localDate) {
    // Specify the Brisbane timezone
    ZoneId brisbaneZone = ZoneId.of("Australia/Brisbane");

    // Create a ZonedDateTime in the Brisbane timezone
    ZonedDateTime zonedDateTime = localDate.atStartOfDay(brisbaneZone);

    // Convert ZonedDateTime to Instant
    return zonedDateTime.toInstant();
  }

  public static String[] splitDates(String dates) {
    Pattern datePattern = Pattern.compile("(\\d{2}/\\d{2}/\\d{2})(?:-(\\d{2}/\\d{2}/\\d{2}))?");

    Matcher matcher = datePattern.matcher(dates);
    String[] datesArray = {null, null};
    if (matcher.find()) {
      String date1 = matcher.group(1);
      String date2 = matcher.group(2);

      datesArray[0] = date1;
      datesArray[1] = date2;
    }
    return datesArray;
  }

  public static String formatTimeToDb(String source, String pattern) {
    Instant time = InstantUtils.convert(source);
    if (time == null) {
      throw new DateFormatProblem(String.format("Incorrectly formatted date '%s'", source));
    }
    ZoneOffset zoneOffset = ZoneOffset.ofHours(10);
    ZonedDateTime zonedDateTime = time.atZone(zoneOffset);
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
    String formattedTime = zonedDateTime.format(formatter);

    return formattedTime;
  }
}
