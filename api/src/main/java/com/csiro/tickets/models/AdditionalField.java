package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Data
@Table(name = "additional_field")
@Entity
@Audited
@EntityListeners(AuditingEntityListener.class)
public class AdditionalField extends BaseAuditableEntity {

  @ManyToOne
  @JoinColumn(name = "ticket_id")
  @JsonBackReference(value = "ticket-additional-field")
  private Ticket ticket;

  @ManyToOne private AdditionalFieldType additionalFieldType;

  @Column private String valueOf;
}
