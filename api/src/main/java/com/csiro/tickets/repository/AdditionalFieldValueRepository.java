package com.csiro.tickets.repository;

import com.csiro.tickets.controllers.dto.AdditionalFieldValueListTypeQueryDto;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AdditionalFieldValueRepository extends JpaRepository<AdditionalFieldValue, Long> {

  @Query(
      "SELECT NEW com.csiro.tickets.controllers.dto.AdditionalFieldValueListTypeQueryDto(aft.id, aft.name, afv.id, afv.valueOf) FROM AdditionalFieldValue afv JOIN afv.additionalFieldType aft WHERE aft.listType = true ORDER BY aft.id, afv.valueOf")
  List<AdditionalFieldValueListTypeQueryDto> findAdditionalFieldValuesForListType();

  @Query("SELECT afv FROM AdditionalFieldValue afv JOIN afv.tickets ticket WHERE ticket = :ticket")
  List<AdditionalFieldValue> findAllByTicket(Ticket ticket);
}
