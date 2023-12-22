package com.csiro.tickets.repository;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketType;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

public interface TicketRepository
    extends JpaRepository<Ticket, Long>, QuerydslPredicateExecutor<Ticket> {

  Page<Ticket> findAll(final Pageable pageable);

//  Page<Ticket> findAll(Predicate predicate, Pageable pageable, OrderSpecifier<String> orderSpecifier);

  Optional<Ticket> findByTitle(String title);

  @Query(
      nativeQuery = true,
      value =
          "SELECT * FROM ticket t LEFT JOIN ticket_labels tl ON tl.ticket_id = t.id JOIN label l ON l.id = tl.label_id WHERE l.name = :labelName")
  Optional<Ticket> findByTitcketLabel(String labelName);

  Optional<Ticket> findByTicketType(TicketType ticketType);

  @Query(
      nativeQuery = true,
      value =
          "SELECT DISTINCT t.* FROM ticket t  JOIN ticket_labels tl on t.id = tl.ticket_id JOIN label l on tl.label_id = l.id where l.name NOT IN :values AND t.state_id = :stateId and t.iteration_id = :iterationId")
  //          "SELECT * FROM Ticket as ticket where ticket.iteration_id = :iterationId and
  // ticket.state_id = :stateId")
  List<Ticket> findAllByIterationAdhaQuery(List<String> values, Long iterationId, Long stateId);

  @Query(
      nativeQuery = true,
      //      value = "SELECT DISTINCT t.* FROM ticket t JOIN ticket_labels tl on t.id =
      // tl.ticket_id JOIN label l on tl.label_id = l.id where l.name NOT IN :values"
      value =
          "SELECT DISTINCT t.* FROM ticket t  JOIN ticket_labels tl on t.id = tl.ticket_id JOIN label l on tl.label_id = l.id where l.name NOT IN :values AND t.state_id != :stateId")
  List<Ticket> findAllAdhaQuery(List<String> values, Long stateId);

  @Query(
      nativeQuery = true,
      value =
          "select t.* from ticket t JOIN ticket_additional_field_values tafv on t.id = tafv.ticket_id where tafv.additional_field_value_id = :additionalFieldValueId")
  Ticket findByAdditionalFieldValueId(Long additionalFieldValueId);
}
