package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "ticket_association")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class TicketAssociation extends BaseAuditableEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "ticket_id", insertable = false, updatable = false)
  @JsonBackReference(value = "ticket-source-association")
  private Ticket associationSource;

  @ManyToOne
  @JoinColumn(name = "ticket_id", insertable = false, updatable = false)
  @JsonBackReference(value = "ticket-target-association")
  private Ticket associationTarget;

  @Column(name = "description")
  private String description;
}
