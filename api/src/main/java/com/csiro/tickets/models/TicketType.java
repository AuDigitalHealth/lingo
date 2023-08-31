package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@Table(name = "ticket_type")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class TicketType extends BaseAuditableEntity {

  @Column private String name;

  @Column private String description;
}
