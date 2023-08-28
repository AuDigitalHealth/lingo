package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.envers.Audited;

@Entity
@Data
@Table(name = "label")
@Audited
public class Label extends BaseAuditableEntity {

  @ManyToOne
  @JsonBackReference(value = "ticket-labels")
  private Ticket ticket;

  @ManyToOne
  @JsonBackReference(value = "label-type")
  private LabelType labelType;
}
