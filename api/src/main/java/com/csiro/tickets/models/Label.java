package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "label")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Label extends BaseAuditableEntity {

  @ManyToOne
  @JsonBackReference(value = "ticket-labels")
  private Ticket ticket;

  @ManyToOne
  @JsonManagedReference(value = "label-type")
  private LabelType labelType;
}
