package com.csiro.tickets.helper;

import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class AdditionalFieldUtils {

  public static String findValueByAdditionalFieldName(String additionalFieldName, Ticket ticket){
    Optional<AdditionalFieldValue> afv = ticket.getAdditionalFieldValues().stream().filter(additionalFieldValue -> {
      return additionalFieldValue.getAdditionalFieldType().getName().equals(additionalFieldName);
    }).findFirst();

    return afv.isPresent() ? afv.get().getValueOf() : "";
  }
}
