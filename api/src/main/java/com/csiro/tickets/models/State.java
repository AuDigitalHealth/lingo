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
@Table(name = "state")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class State extends BaseAuditableEntity {

  @Column(name = "label")
  private String label;

  @Column(name = "description")
  private String description;

  @Column(name = "grouping")
  private Integer grouping;
}
