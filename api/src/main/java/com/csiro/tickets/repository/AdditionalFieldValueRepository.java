package com.csiro.tickets.repository;

import com.csiro.tickets.helper.FieldValueTicketPair;
import com.csiro.tickets.models.AdditionalFieldType;
import com.csiro.tickets.models.AdditionalFieldValue;
import com.csiro.tickets.models.Ticket;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdditionalFieldValueRepository extends JpaRepository<AdditionalFieldValue, Long> {

  @Query(
      "SELECT afv FROM AdditionalFieldValue afv JOIN afv.additionalFieldType aft WHERE aft.type = 'LIST' ORDER BY aft.id, afv.valueOf")
  List<AdditionalFieldValue> findAdditionalFieldValuesForListType();

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

  @Query(
      value =
          "SELECT afv.* "
              + "FROM additional_field_value afv "
              + "JOIN ticket_additional_field_values tafv ON tafv.additional_field_value_id = afv.id "
              + "WHERE afv.additional_field_type_id = :additionalFieldTypeId "
              + "AND afv.value_of = :valueOf "
              + "AND tafv.ticket_id = :ticketId",
      nativeQuery = true)
  Optional<AdditionalFieldValue> findByValueOfAndTypeIdAndTicketId(
      @Param("additionalFieldTypeId") Long additionalFieldTypeId,
      @Param("valueOf") String valueOf,
      @Param("ticketId") Long ticketId);

  @Query(
      "SELECT afv from AdditionalFieldValue afv where afv.additionalFieldType = :additionalFieldType")
  List<AdditionalFieldValue> findByTypeId(AdditionalFieldType additionalFieldType);

  @Query(
      "SELECT new com.csiro.tickets.helper.FieldValueTicketPair(afv.valueOf, t.id) "
          + "FROM AdditionalFieldValue afv LEFT JOIN afv.tickets t "
          + "WHERE afv.additionalFieldType = :additionalFieldType AND t.id IS NOT NULL")
  List<FieldValueTicketPair> findByTypeIdObject(
      @Param("additionalFieldType") AdditionalFieldType additionalFieldType);

  @Query(
      "SELECT afv FROM AdditionalFieldValue afv "
          + "WHERE afv.additionalFieldType = :additionalFieldType "
          + "AND afv.valueOf IN :valueOfList")
  List<AdditionalFieldValue> findByValueOfInAndTypeId(
      @Param("additionalFieldType") AdditionalFieldType additionalFieldType,
      @Param("valueOfList") List<String> valueOfList);
}
