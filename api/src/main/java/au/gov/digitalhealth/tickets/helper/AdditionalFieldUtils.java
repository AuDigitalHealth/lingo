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

import au.gov.digitalhealth.tickets.AdditionalFieldValueDto;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType.Type;
import au.gov.digitalhealth.tickets.models.AdditionalFieldValue;
import au.gov.digitalhealth.tickets.models.Ticket;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import java.util.Set;

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

  public static String getAdditionalFieldValueByTypeName(
      Set<AdditionalFieldValueDto> additionalFieldValueDtos, String typeName) {
    return additionalFieldValueDtos.stream()
        .filter(
            additionalFieldValueDto ->
                additionalFieldValueDto.getAdditionalFieldType().getName().equals(typeName))
        .findFirst()
        .orElseThrow()
        .getValueOf();
  }
}
