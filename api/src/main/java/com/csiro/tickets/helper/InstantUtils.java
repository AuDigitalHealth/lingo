package com.csiro.tickets.helper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class InstantUtils {

  public static Instant convert(String source) {
    if (source.equals("")) return null;

    // Try parsing with "dd/MM/yyyy" format
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    try {
      LocalDate localDate = LocalDate.parse(source, formatter);
      return convertLocalDateToInstant(localDate);
    } catch (Exception e) {
      // If parsing with "dd/MM/yyyy" format fails, try "dd/MM/yy" format
      formatter = DateTimeFormatter.ofPattern("dd/MM/yy");
      LocalDate localDate = LocalDate.parse(source, formatter);
      return convertLocalDateToInstant(localDate);
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
}
