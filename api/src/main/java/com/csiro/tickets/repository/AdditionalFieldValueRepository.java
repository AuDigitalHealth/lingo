package com.csiro.tickets.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.csiro.tickets.controllers.dto.AdditionalFieldValueForListTypeDto;
import com.csiro.tickets.models.AdditionalFieldValue;

public interface AdditionalFieldValueRepository extends JpaRepository<AdditionalFieldValue, Long> {

  @Query(nativeQuery = true, name = "findAdditionalFieldValuesForListType")
  List<AdditionalFieldValueForListTypeDto> findAdditionalFieldValuesForListType();


  @Query(
      nativeQuery = true,
      value =
          "SELECT * FROM additional_field_value afv JOIN ticket_additional_field_values as tafv ON tafv.additional_field_value_id = afv.id JOIN ticket t ON t.id = tafv.ticket_id WHERE t.id = :ticketid;")
  List<AdditionalFieldValue> findAllByTicketId(Long ticketid);
}
