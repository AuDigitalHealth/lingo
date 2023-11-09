package com.csiro.tickets.helper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.core.convert.converter.Converter;

public class CustomStringToInstant implements Converter<String, Instant> {

  // comes in the format of DD/MM/YYYY
  @Override
  public Instant convert(String source) {
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

  private Instant convertLocalDateToInstant(LocalDate localDate) {
    // Specify the Brisbane timezone
    ZoneId brisbaneZone = ZoneId.of("Australia/Brisbane");

    // Create a ZonedDateTime in the Brisbane timezone
    ZonedDateTime zonedDateTime = localDate.atStartOfDay(brisbaneZone);

    // Convert ZonedDateTime to Instant
    return zonedDateTime.toInstant();
  }
}
