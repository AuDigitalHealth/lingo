package com.csiro.tickets.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(
    name = "json_field",
    uniqueConstraints = @UniqueConstraint(columnNames = {"name", "ticket_id"}))
@Entity
@Audited
@EntityListeners(AuditingEntityListener.class)
public class JsonField extends BaseAuditableEntity {

  @Column(name = "name")
  private String name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ticket_id")
  @JsonIgnoreProperties("jsonFields") // Avoiding recursion
  private Ticket ticket;

  @NotNull
  @JdbcTypeCode(SqlTypes.JSON)
  private JsonNode value;
}
