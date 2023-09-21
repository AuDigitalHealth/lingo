package com.csiro.tickets.repository;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/*
   Dormant repository,
   Ticket tales await,
   Future queries bring me to life.
*/
public interface TicketRepository extends JpaRepository<Ticket, Long> {

  // @Query(
  //      "SELECT t, ty.e FROM Ticket t JOIN t.additionalFieldValues v LEFT JOIN
  // v.additionalFieldType ty WHERE ty.listType = true")
  // List<Ticket> findAll();

  Optional<Ticket> findByTitle(String title);

  Optional<Ticket> findByTicketType(TicketType ticketType);

  // @Query("select tc from Ticket tc left join AdditionalFields af on af.itcketId = tc.id join"
  // + "AdditionalFieldType aft on af.additionalFieldTypeId = aft.id where aft.name = :fieldName
  // and"
  // + "af.value_of = :valueOf")
  // List<Ticket> findByAdditionalFields(String fieldName, String valueOf);
}
