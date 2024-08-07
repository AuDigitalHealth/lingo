package com.csiro.tickets.repository;

import com.csiro.tickets.models.*;
import com.querydsl.core.types.Predicate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.EntityGraph.EntityGraphType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;

public interface TicketRepository
    extends JpaRepository<Ticket, Long>, QuerydslPredicateExecutor<Ticket>, TicketRepositoryCustom {

  @EntityGraph(value = "Ticket.backlogSearch", type = EntityGraphType.LOAD)
  Page<Ticket> findAll(Predicate predicate, Pageable pageable);

  @EntityGraph(value = "Ticket.backlogSearch", type = EntityGraph.EntityGraphType.FETCH)
  // This does not guarantee the order of results in the IN clause are in the same order as they
  // were passed in
  // postgres optimizes this itself, and returns a result set that is ordered in whatever way that
  // it deemed was the quickest.
  List<Ticket> findByIdIn(Collection<Long> ids);

  @Query(
      "SELECT DISTINCT t FROM Ticket t "
          + "LEFT JOIN FETCH t.labels "
          + "LEFT JOIN FETCH t.externalRequestors "
          + "LEFT JOIN FETCH t.jsonFields "
          +
          // Add more JOIN FETCH clauses for other lazy associations
          "WHERE (:predicate is null or :predicate = true)")
  Page<Ticket> findAllForBacklog(@Param("predicate") Predicate predicate, Pageable pageable);

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
          "SELECT DISTINCT t.* FROM ticket t  JOIN ticket_external_requestors te on t.id = te.ticket_id JOIN external_requestor e on te.external_requestor_id = e.id where  t.state_id = :stateId and t.iteration_id = :iterationId")
  //          "SELECT * FROM Ticket as ticket where ticket.iteration_id = :iterationId and
  // ticket.state_id = :stateId")
  List<Ticket> findAllByIterationAdhaQuery(Long iterationId, Long stateId);

  @Query(
      nativeQuery = true,
      //      value = "SELECT DISTINCT t.* FROM ticket t JOIN ticket_labels tl on t.id =
      // tl.ticket_id JOIN label l on tl.label_id = l.id where l.name NOT IN :values"
      value =
          "SELECT DISTINCT t.* FROM ticket t  JOIN ticket_external_requestors te on t.id = te.ticket_id JOIN external_requestor e on te.external_requestor_id = e.id where  t.state_id != :stateId")
  List<Ticket> findAllAdhaQuery(Long stateId);

  @Query(
      """
    select t from Ticket t join fetch t.additionalFieldValues afv join fetch afv.additionalFieldType aft
    left join fetch t.jsonFields left join fetch t.labels
    where aft.name = :fieldType and afv.valueOf in :additionalFieldValue
    """)
  List<Ticket> findByAdditionalFieldValueIds(
      @Param("fieldType") String additionalFieldTypeName,
      @Param("additionalFieldValue") List<String> additionalFieldValue);

  @Query(
      """
      select t from Ticket t left join fetch t.additionalFieldValues afv left join fetch afv.additionalFieldType aft
      left join fetch t.jsonFields left join fetch t.labels where t.id IN :ticketIds
      """)
  List<Ticket> findByIdList(@Param("ticketIds") List<Long> ticketIds);

  @Query(
      nativeQuery = true,
      value =
          "select t.* from ticket t JOIN ticket_additional_field_values tafv on t.id = tafv.ticket_id where tafv.additional_field_value_id = :additionalFieldValueId")
  List<Ticket> findByAdditionalFieldValueId(Long additionalFieldValueId);

  List<Ticket> findAllByLabels(Label label);

  List<Ticket> findAllByIteration(Iteration iteration);

  List<Ticket> findAllByExternalRequestors(ExternalRequestor externalRequestor);

  @Query(
      "SELECT t FROM Ticket t JOIN t.state state WHERE state.label NOT IN :labels AND t.taskAssociation IS NOT NULL")
  List<Ticket> findAllByStatesNotInWithTask(List<String> labels);
}
