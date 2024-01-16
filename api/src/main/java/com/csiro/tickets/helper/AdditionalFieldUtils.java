package com.csiro.tickets.helper;

import com.csiro.tickets.models.AdditionalFieldType.Type;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;

public class AdditionalFieldUtils {

  private AdditionalFieldUtils() {}

  public static String findValueByAdditionalFieldName(String additionalFieldName, Ticket ticket) {
    Optional<AdditionalFieldValue> afv =
        ticket.getAdditionalFieldValues().stream()
            .filter(
                additionalFieldValue ->
                    additionalFieldValue
                        .getAdditionalFieldType()
                        .getName()
                        .equals(additionalFieldName))
            .findFirst();

    return afv.map(AdditionalFieldUtils::formatAdditionalFieldValue).orElse("");
  }

  public static String formatAdditionalFieldValue(AdditionalFieldValue afv) {
    if (afv.getAdditionalFieldType().getType() == Type.DATE) {
      Instant instant = Instant.parse(afv.getValueOf());

      return formatDate(instant);
    }

    return afv.getValueOf();
  }

  public static String formatDate(Instant instant) {
    if (instant == null) return "";

    DateTimeFormatter dtFormatter =
        DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Australia/Brisbane"));

    return dtFormatter.format(instant);
  }

  // formats yyyyMMdd
  public static String formatDateFromTitle(String inputDate) {
    if (!isValidFormat(inputDate, "yyyyMMdd")) {
      // If not, return the original input string
      return inputDate;
    }
    DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
    LocalDate date = LocalDate.parse(inputDate, inputFormatter);

    DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    return date.format(outputFormatter);
  }

  private static boolean isValidFormat(String value, String format) {
    try {
      LocalDate.parse(value, DateTimeFormatter.ofPattern(format));
      return true;
    } catch (DateTimeParseException e) {
      return false;
    }
  }
}
