package com.csiro.tickets.repository;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/*
   Dormant repository,
   Ticket tales await,
   Future queries bring me to life.
*/
public interface TicketRepository extends JpaRepository<Ticket, Long> {

  @Query(nativeQuery = true, value = "SELECT * FROM ticket limit 100")
  List<Ticket> find100();

  Optional<Ticket> findByTitle(String title);

  Optional<Ticket> findByTicketType(TicketType ticketType);

  // @Query("select tc from Ticket tc left join AdditionalFields af on af.itcketId = tc.id join"
  // + "AdditionalFieldType aft on af.additionalFieldTypeId = aft.id where aft.name = :fieldName
  // and"
  // + "af.value_of = :valueOf")
  // List<Ticket> findByAdditionalFields(String fieldName, String valueOf);
}
