package com.csiro.tickets.repository;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.models.TicketAssociation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketAssociationRepository extends JpaRepository<TicketAssociation, Long> {
  List<TicketAssociation> findByAssociationSourceAndAssociationTarget(Ticket source, Ticket target);

  @Query(
      "SELECT ta FROM TicketAssociation ta WHERE (ta.associationSource = :source AND ta.associationTarget = :target) OR (ta.associationSource = :target AND ta.associationTarget = :source)")
  List<TicketAssociation> findBySourceAndTargetFlipped(
      @Param("source") Ticket source, @Param("target") Ticket target);
}
