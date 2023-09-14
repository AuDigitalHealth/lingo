package com.csiro.tickets.repository;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/*
   Dormant repository,
   Ticket tales await,
   Future queries bring me to life.
*/
public interface TicketRepository extends JpaRepository<Ticket, Long> {

  List<Ticket> findByTitle(String title);

  List<Ticket> findByTicketType(TicketType ticketType);

  //@Query("select tc from Ticket tc left join AdditionalField af on af.ticket_id = tc.id join AdditionalFieldType aft on af.additional_field_type_id = aft.id where aft.name = :fieldName and af.value_of = :valueOf")
  //List<Ticket> findByAdditionalField(String fieldName, String valueOf);
}
