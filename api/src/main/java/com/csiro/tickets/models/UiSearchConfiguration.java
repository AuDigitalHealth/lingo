package com.csiro.tickets.models;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Table(
    name = "ui_search_configuration",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"username", "name"})})
@Audited
@EntityListeners(AuditingEntityListener.class)
public class UiSearchConfiguration extends BaseAuditableEntity {

  @NotNull private String username;

  @ManyToOne private TicketFilters filter;

  private int grouping;
}
