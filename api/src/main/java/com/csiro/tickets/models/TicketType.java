package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.envers.Audited;

@Entity
@Data
@Table(name = "ticket_type")
@Audited
public class TicketType extends BaseAuditableEntity {

  @Column private String name;

  @Column private String description;
}
