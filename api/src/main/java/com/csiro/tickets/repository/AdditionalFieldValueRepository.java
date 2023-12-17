package com.csiro.tickets.repository;

import com.csiro.tickets.AdditionalFieldValueListTypeQueryDto;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AdditionalFieldValueRepository extends JpaRepository<AdditionalFieldValue, Long> {

  @Query(
      "SELECT NEW com.csiro.tickets.AdditionalFieldValueListTypeQueryDto(aft.id, aft.name, aft.type, afv.id, afv.valueOf) FROM AdditionalFieldValue afv JOIN afv.additionalFieldType aft WHERE aft.type = 'LIST' ORDER BY aft.id, afv.valueOf")
  List<AdditionalFieldValueListTypeQueryDto> findAdditionalFieldValuesForListType();

  @Query("SELECT afv FROM AdditionalFieldValue afv JOIN afv.tickets ticket WHERE ticket = :ticket")
  List<AdditionalFieldValue> findAllByTicket(Ticket ticket);

  @Query(
      "SELECT afv from AdditionalFieldValue afv join fetch afv.tickets ticket  join fetch afv.additionalFieldType aft where (ticket = :ticket and aft = :additionalFieldType)")
  Optional<AdditionalFieldValue> findAllByTicketAndType(
      Ticket ticket, AdditionalFieldType additionalFieldType);

  @Query(
      "SELECT afv from AdditionalFieldValue afv where afv.additionalFieldType = :additionalFieldType and afv.valueOf = :valueOf")
  Optional<AdditionalFieldValue> findByValueOfAndTypeId(
      AdditionalFieldType additionalFieldType, String valueOf);
}
