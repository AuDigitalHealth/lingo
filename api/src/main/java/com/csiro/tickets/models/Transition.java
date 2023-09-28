package com.csiro.tickets.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@SuperBuilder
@Table(name = "transition")
@Audited
@EntityListeners(AuditingEntityListener.class)
public class Transition extends BaseAuditableEntity {

  @Column private String name;
}
