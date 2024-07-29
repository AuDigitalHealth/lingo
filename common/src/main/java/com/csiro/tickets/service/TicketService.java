package com.csiro.tickets.service;

import com.csiro.tickets.TicketMinimalDto;
import java.util.List;

public interface TicketService {
  List<TicketMinimalDto> findByAdditionalFieldTypeNameAndListValueOf(
      String fieldType, List<String> values);
}
