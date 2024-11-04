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
package au.gov.digitalhealth.tickets.repository;

import au.gov.digitalhealth.tickets.helper.FieldValueTicketPair;
import au.gov.digitalhealth.tickets.models.AdditionalFieldType;
import au.gov.digitalhealth.tickets.models.AdditionalFieldValue;
import au.gov.digitalhealth.tickets.models.Ticket;
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
      "SELECT new au.gov.digitalhealth.tickets.helper.FieldValueTicketPair(afv.valueOf, t.id) "
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
