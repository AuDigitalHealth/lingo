package com.csiro.tickets.models;

import com.csiro.tickets.helper.SearchConditionBody;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Audited
@EntityListeners(AuditingEntityListener.class)
@Table(name = "ticket_filters", uniqueConstraints = @UniqueConstraint(columnNames = "name"))
public class TicketFilters extends BaseAuditableEntity {

  @NotNull private String name;

  @NotNull
  @JdbcTypeCode(SqlTypes.JSON)
  private SearchConditionBody filter;
}
